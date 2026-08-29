"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { API_BASE_URL, fetchHealth } from "@/lib/api";

type State =
  | { kind: "loading" }
  | { kind: "ok"; status: string }
  | { kind: "error"; message: string };

/**
 * Round-trips `GET {NEXT_PUBLIC_API_BASE_URL}/health` from the browser on mount,
 * so the demo actually exercises CORS and the public API URL. The surrounding
 * page renders regardless of the outcome.
 */
export default function HealthCheck() {
  const [state, setState] = React.useState<State>({ kind: "loading" });

  React.useEffect(() => {
    const controller = new AbortController();
    fetchHealth(controller.signal)
      .then((body) => setState({ kind: "ok", status: body.status }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "unreachable",
        });
      });
    return () => controller.abort();
  }, []);

  if (state.kind === "loading") {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }} role="status">
        <CircularProgress size={16} />
        <span>Checking the API…</span>
      </Box>
    );
  }

  if (state.kind === "ok") {
    return <Alert severity="success">API: {state.status}</Alert>;
  }

  return (
    <Alert severity="warning">
      API unavailable at {API_BASE_URL} ({state.message}). The clinic front desk
      is still open — try again shortly.
    </Alert>
  );
}
