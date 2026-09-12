"""Send OTEL traces to a local Phoenix server.

Phoenix must already be running (see README.md) — this only configures the
exporter, it does not start the server.
"""

from functools import cache

from phoenix.otel import register, TracerProvider


@cache
def setup_tracing() -> TracerProvider:
    return register(project_name="example-agent", auto_instrument=False)
