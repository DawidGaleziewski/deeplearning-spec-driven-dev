"""Router: drives the sales-analysis agent's tool-calling loop.

Calls the model with the ``tools`` schema, dispatches any tool calls it
requests via ``tool_implementations``, feeds the results back, and repeats
until the model responds with a plain-text answer instead of more tool
calls.
"""

import json

from phoenix.server.api.routers.v1.spans import StatusCode

from .llm_client import MODEL, client
from .tools.functions.main import tool_implementations, tools
from .tracing import setup_tracing
from openinference.instrumentation.openai import OpenAIInstrumentor

tracer_provider = setup_tracing()
OpenAIInstrumentor().instrument(
    tracer_provider=tracer_provider)

trace = tracer_provider.get_tracer(__name__)

SYSTEM_PROMPT = """
You are a helpful assistant that can answer questions about the Store
Sales Price Elasticity Promotions dataset.
"""

# Decorators area easy way to trace if we dont need extra logic. They will threat this as single span and mark both input and output
@trace.chain()
def handle_tool_calls(tool_calls, messages):
    for tool_call in tool_calls:
        function = tool_implementations[tool_call.function.name]
        function_args = json.loads(tool_call.function.arguments)
        result = function(**function_args)
        messages.append(
            {
                "role": "tool",
                "content": result,
                "tool_call_id": tool_call.id,
            }
        )
    return messages


def run_agent(messages):
    if isinstance(messages, str):
        messages = [{"role": "user", "content": messages}]

    if not any(message["role"] == "system" for message in messages):
        messages.insert(0, {"role": "system", "content": SYSTEM_PROMPT})

    while True:
        print("Making router call to OpenAI")
        # Tracing router calls:
        # Chain  is like a default, basic logic step without any LLm calls etc
        with trace.start_as_current_span("router_call", openinference_span_kind="chain") as span:
            span.set_input(value=messages)
            response = client.chat.completions.create(
                model=MODEL,
                messages=messages,
                tools=tools,
            )
            messages.append(response.choices[0].message)
            tool_calls = response.choices[0].message.tool_calls
            span.set_output(StatusCode.OK)

            if tool_calls:
                print("Processing tool calls")
                messages = handle_tool_calls(tool_calls, messages)
                span.set_output(value=tool_calls)
            else:
                print("No tool calls, returning final answer")
                span.set_output(value=response.choices[0].message.content)
                return response.choices[0].message.content

# This is a wrapper to get our instrumentation going
def start_main_span(messeges):
    print("Starting main span with messages: ", messeges)

    with trace.start_as_current_span("AgentRun", openinference_span_kind="agent") as span:
        span.set_input(value=messeges)
        ret = run_agent(messeges)
        print("Main span completed with return value: ", ret)
        span.set_output(value=ret)
        span.set_status(StatusCode.OK)
        return ret

def main() -> None:
    result = start_main_span(
        "Look up all sales data for store 1320 on November 1st, 2021, then analyze the data to identify any pricing or promotion trends, and finally generate a visualization showing the sales trend."
    )
    print(result)


if __name__ == "__main__":
    main()
