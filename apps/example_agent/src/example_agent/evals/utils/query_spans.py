from phoenix.client import Client
from phoenix.client.types.spans import SpanQuery

from example_agent.tracing import PROJECT_NAME

def get_phoenix_spans(project_name: str, span_kind: str, fields: list[str]):
    query = SpanQuery().where(
        # Filter for the `LLM` span kind.
        # The filter condition is a string of valid Python boolean expression.
        f"span_kind == '{span_kind}'",
    ).select(
        *fields,
    )


    # The Phoenix Client can take this query and return the dataframe.
    tool_calls_df = Client().spans.get_spans_dataframe(
        query=query,
        project_identifier=project_name,
    )
    tool_calls_df = tool_calls_df.rename(
        columns={"input.value": "question", "llm.tools": "tool_call"}
    )
    tool_calls_df = tool_calls_df.dropna(subset=["tool_call"])

    return tool_calls_df.head()