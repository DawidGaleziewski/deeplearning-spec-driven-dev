/**
 * `@clinic/types` — the HTTP contract shared by the NestJS API and the Next.js
 * frontend. Types only: no runtime code, no `class-validator` decorators, no
 * dependency on TypeORM or Nest. The API's DTO classes `implement` the request
 * types below; the frontend's `src/lib/api.ts` consumes the response types.
 *
 * Introduced in Phase 3 (agent & ailment management). Later phases add the
 * therapy, booking, and dashboard shapes here.
 */
/**
 * A therapy as it appears in an ailment's recommended list. Read-only in
 * Phase 3 — the editable therapy directory is Phase 4.
 */
export interface TherapySummary {
    id: string;
    name: string;
}
/** The owning agent, summarised, as embedded in an ailment response. */
export interface AgentSummary {
    id: string;
    name: string;
}
/** A complaint an agent presents with, as returned by the API. */
export interface AilmentResponse {
    id: string;
    name: string;
    description: string | null;
    /** `null` while the complaint is logged but not yet attached to an agent. */
    agent: AgentSummary | null;
    recommendedTherapies: TherapySummary[];
    /** ISO 8601 timestamp. */
    createdAt: string;
    /** ISO 8601 timestamp. */
    updatedAt: string;
}
/** An agent ("patient"), with its complaints embedded, as returned by the API. */
export interface AgentResponse {
    id: string;
    name: string;
    description: string | null;
    ailments: AilmentResponse[];
    /** ISO 8601 timestamp. */
    createdAt: string;
    /** ISO 8601 timestamp. */
    updatedAt: string;
}
export interface CreateAgentBody {
    name: string;
    description?: string | null;
}
export type UpdateAgentBody = Partial<CreateAgentBody>;
export interface CreateAilmentBody {
    name: string;
    description?: string | null;
    /** Attach to an agent on creation. Omit to log the complaint unattached. */
    agentId?: string | null;
}
/** All fields optional. Send `agentId: null` to detach an existing complaint. */
export type UpdateAilmentBody = Partial<CreateAilmentBody>;
