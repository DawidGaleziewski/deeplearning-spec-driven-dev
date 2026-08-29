/**
 * Base URL of the NestJS API. Read from a public env var so the browser bundle
 * can see it and so it is not hard-coded to localhost. Defaults to the Phase 2
 * dev port.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export interface HealthResponse {
  status: string;
  uptime?: number;
  timestamp?: string;
}

/** Fetch the API liveness endpoint. Throws on network error or non-2xx. */
export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE_URL}/health`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`API responded ${res.status}`);
  }
  return (await res.json()) as HealthResponse;
}
