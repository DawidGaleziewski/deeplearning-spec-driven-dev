"""Router: drives the sales-analysis agent's tool-calling loop.

Calls the model with the ``tools`` schema, dispatches any tool calls it
requests via ``tool_implementations``, feeds the results back, and repeats
until the model responds with a plain-text answer instead of more tool
calls.
"""

import json

from .llm_client import MODEL, client
from .tools.functions.main import tool_implementations, tools
from .tracing import setup_tracing

SYSTEM_PROMPT = """
You are a helpful assistant that can answer questions about the Store
Sales Price Elasticity Promotions dataset.
"""


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
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            tools=tools,
        )
        messages.append(response.choices[0].message)
        tool_calls = response.choices[0].message.tool_calls

        if tool_calls:
            print("Processing tool calls")
            messages = handle_tool_calls(tool_calls, messages)
        else:
            print("No tool calls, returning final answer")
            return response.choices[0].message.content


def main() -> None:
    setup_tracing()
    result = run_agent(
        "Show me all the sales for store 1320 on November 1st, 2021"
    )
    print(result)


if __name__ == "__main__":
    main()
