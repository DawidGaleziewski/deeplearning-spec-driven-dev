"""Send OTEL traces to a local Phoenix server.

Phoenix must already be running (see README.md) — this only configures the
exporter, it does not start the server.
"""

from functools import cache

from phoenix.otel import register, TracerProvider

PROJECT_NAME = "example-agent-evals"
@cache
def setup_tracing() -> TracerProvider:
    return register(project_name=PROJECT_NAME, auto_instrument=False)
