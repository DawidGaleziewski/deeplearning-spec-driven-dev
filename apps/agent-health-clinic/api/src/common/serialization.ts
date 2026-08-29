import type {
  AgentResponse,
  AilmentResponse,
  TherapySummary,
} from '@clinic/types';
import type { Agent } from '../entities/agent.entity.js';
import type { Ailment } from '../entities/ailment.entity.js';
import type { Therapy } from '../entities/therapy.entity.js';

/**
 * Entity → HTTP response mapping. Keeps `@clinic/types` as the wire contract:
 * dates become ISO strings and relations are trimmed to the summary shape,
 * regardless of how much TypeORM eager-loaded.
 */

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function toTherapySummary(therapy: Therapy): TherapySummary {
  return { id: therapy.id, name: therapy.name };
}

export function toAilmentResponse(ailment: Ailment): AilmentResponse {
  return {
    id: ailment.id,
    name: ailment.name,
    description: ailment.description ?? null,
    agent: ailment.agent
      ? { id: ailment.agent.id, name: ailment.agent.name }
      : null,
    recommendedTherapies: (ailment.recommendedTherapies ?? []).map(
      toTherapySummary,
    ),
    createdAt: toIso(ailment.createdAt),
    updatedAt: toIso(ailment.updatedAt),
  };
}

export function toAgentResponse(agent: Agent): AgentResponse {
  return {
    id: agent.id,
    name: agent.name,
    description: agent.description ?? null,
    ailments: (agent.ailments ?? [])
      .slice()
      .sort((a, b) => toIso(a.createdAt).localeCompare(toIso(b.createdAt)))
      .map(toAilmentResponse),
    createdAt: toIso(agent.createdAt),
    updatedAt: toIso(agent.updatedAt),
  };
}
