"""Send OTEL traces to a local Phoenix server.

Phoenix must already be running (see README.md) — this only configures the
exporter, it does not start the server.
"""

from phoenix.otel import register


def setup_tracing() -> None:
    register(project_name="example-agent", auto_instrument=True)
