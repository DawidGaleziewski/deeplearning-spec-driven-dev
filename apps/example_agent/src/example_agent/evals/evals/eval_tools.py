import json
from openinference.instrumentation import suppress_tracing
from phoenix.client import Client
from phoenix.evals import create_classifier, evaluate_dataframe
from phoenix.evals.llm import LLM
from phoenix.evals.utils import to_annotation_dataframe

from example_agent.evals.utils.query_spans import get_phoenix_spans
from example_agent.tracing import PROJECT_NAME
from example_agent.tools.functions.main import tools

TOOL_CALLING_PROMPT_TEMPLATE = """
You are evaluating whether an LLM made the correct tool call given the user prompt and the available tools.

Available tools:
{tool_definitions}

User input:
{question}

Evaluate whether the model called the appropriate tool with the right arguments.
Respond with either 'correct' or 'incorrect'.
"""


tool_spans = get_phoenix_spans(PROJECT_NAME, "LLM", ["input.value", "llm.tools"])

prompt_template = TOOL_CALLING_PROMPT_TEMPLATE.replace(
    "{tool_definitions}",
    json.dumps(tools).replace("{", '"').replace("}", '"'),
)

llm = LLM(provider="openai", model="gpt-4o")

tool_calling_evaluator = create_classifier(
    name="tool_calling",
    prompt_template=prompt_template,
    llm=llm,
    choices={"correct": 1, "incorrect": 0},
)

# Suppress tracking not to get this into pheonix
with suppress_tracing():
    tool_call_eval = evaluate_dataframe(
        dataframe=tool_spans,
        evaluators=[tool_calling_evaluator],
    )

tool_call_eval.head()

# Log the eval results back to Phoenix as span annotations so they show up in the UI.
annotations_df = to_annotation_dataframe(dataframe=tool_call_eval)
Client().spans.log_span_annotations_dataframe(dataframe=annotations_df)