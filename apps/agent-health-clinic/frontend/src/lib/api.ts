import type {
  AgentResponse,
  AilmentResponse,
  CreateAgentBody,
  CreateAilmentBody,
  UpdateAgentBody,
  UpdateAilmentBody,
} from "@clinic/types";

/**
 * Base URL of the NestJS API. Read from a public env var so the browser bundle
 * can see it and so it is not hard-coded to localhost. Defaults to the dev port.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export interface HealthResponse {
  status: string;
  uptime?: number;
  timestamp?: string;
}

/** Thrown on any non-2xx response; carries the HTTP status and the API's message. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = opts;
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ApiError(0, err instanceof Error ? err.message : "Network error");
  }

  if (!res.ok) {
    throw new ApiError(res.status, await readError(res, method, path));
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function readError(
  res: Response,
  method: string,
  path: string,
): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message.join(", ");
    if (data.message) return data.message;
  } catch {
    // fall through to a generic message
  }
  return `${method} ${path} failed (${res.status})`;
}

// --- Health --------------------------------------------------------------

/** Fetch the API liveness endpoint. Throws on network error or non-2xx. */
export function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return request<HealthResponse>("/health", { signal });
}

// --- Agents -------------------------------------------------------------

export function listAgents(signal?: AbortSignal): Promise<AgentResponse[]> {
  return request<AgentResponse[]>("/agents", { signal });
}

export function getAgent(
  id: string,
  signal?: AbortSignal,
): Promise<AgentResponse> {
  return request<AgentResponse>(`/agents/${id}`, { signal });
}

export function createAgent(body: CreateAgentBody): Promise<AgentResponse> {
  return request<AgentResponse>("/agents", { method: "POST", body });
}

export function updateAgent(
  id: string,
  body: UpdateAgentBody,
): Promise<AgentResponse> {
  return request<AgentResponse>(`/agents/${id}`, { method: "PATCH", body });
}

export function deleteAgent(id: string): Promise<void> {
  return request<void>(`/agents/${id}`, { method: "DELETE" });
}

// --- Ailments (complaints) --------------------------------------------

/** Log a complaint already attached to `agentId` (the check-in "add" action). */
export function addAilment(
  agentId: string,
  body: Omit<CreateAilmentBody, "agentId">,
): Promise<AilmentResponse> {
  return request<AilmentResponse>(`/agents/${agentId}/ailments`, {
    method: "POST",
    body,
  });
}

export function updateAilment(
  id: string,
  body: UpdateAilmentBody,
): Promise<AilmentResponse> {
  return request<AilmentResponse>(`/ailments/${id}`, { method: "PATCH", body });
}

export function deleteAilment(id: string): Promise<void> {
  return request<void>(`/ailments/${id}`, { method: "DELETE" });
}
