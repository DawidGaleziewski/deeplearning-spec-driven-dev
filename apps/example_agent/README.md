# example-agent

A tool-calling sales-analysis agent, plus local OTEL tracing via
[Arize Phoenix](https://arize.com/docs/phoenix).

## Setup

```bash
uv sync
```

Add your OpenAI key to `.env`:

```
OPENAI_API_KEY=sk-...
```

## Start the agent

```bash
uv run example-agent
```

This runs `main()` in `src/example_agent/agent.py`, which also configures
OTEL tracing (see `src/example_agent/tracing.py`) so every model call and
tool call shows up in Phoenix.

To use the agent from your own code/notebook instead:

```python
from example_agent.agent import run_agent

run_agent("Show me all the sales for store 1320 on November 1st, 2021")
```

## Add packages

Phoenix is installed as a local dependency via `uv` — no Docker required.

```bash
uv add <package>              # runtime dependency
uv add --group dev <package>  # dev-only dependency
```

## Open the Phoenix server

Phoenix runs as a local process (started separately from the agent) and
serves both the UI and the OTLP collector that the agent sends traces to.

```bash
uv run phoenix serve
```

Then open the UI at [http://localhost:6006](http://localhost:6006).

Leave `phoenix serve` running in one terminal, then run the agent
(`uv run example-agent`) in another — traces will appear in the Phoenix UI
under the `example-agent` project as the agent runs.
