# Plan — Agent & Ailment Management

Task groups roughly in dependency order. Group 1 lands the shared contract;
group 2 sets the REST conventions; groups 3–4 (API resources) unblock groups
6–8 (frontend) once the response shapes are stable. Groups 3 and 4 can proceed
in parallel after group 2.

## 1. Shared `@clinic/types` package

1.1. Create `apps/agent-health-clinic/packages/types/` — own `package.json`
     (`name: "@clinic/types"`, private), `tsconfig.json`, `src/index.ts`.
     No runtime deps; no TypeORM / Nest imports.
1.2. Define and export:
     - `TherapySummary` = `{ id: string; name: string }`
     - `AilmentResponse` = `{ id, name, description: string | null, agent:
       { id: string; name: string } | null, recommendedTherapies:
       TherapySummary[], createdAt: string, updatedAt: string }`
     - `AgentResponse` = `{ id, name, description: string | null, ailments:
       AilmentResponse[], createdAt: string, updatedAt: string }`
     - `CreateAgentBody` / `UpdateAgentBody`,
       `CreateAilmentBody` / `UpdateAilmentBody` (see requirements for fields;
       `UpdateAilmentBody.agentId?: string | null`).
1.3. Give it a `build` script (`tsc` → `dist/` with `.d.ts`) and set
     `main` / `types` / `exports`. Pick the linking approach (recommend:
     `prepare` script so `file:` installs build it) and confirm a clean
     install works.
1.4. Add `"@clinic/types": "file:../packages/types"` to `api/package.json` and
     `frontend/package.json`; install both. For the frontend, add
     `transpilePackages: ["@clinic/types"]` to `next.config` only if the
     chosen approach needs it.
1.5. Document the package + the setup step in
     `apps/agent-health-clinic/README.md`.

## 2. API — validation & REST baseline

2.1. Add `class-validator` and `class-transformer` to `api/package.json`;
     install.
2.2. In `main.ts`, register a global `ValidationPipe({ whitelist: true,
     forbidNonWhitelisted: true, transform: true })`. Leave CORS / `PORT`
     untouched.
2.3. Add a `src/common/` home for shared DTO helpers only if groups 3–4
     actually need one (e.g. a trim transform).
2.4. Sanity-check `GET /` and `GET /health` still respond unchanged with the
     pipe active.

## 3. API — Agents resource

3.1. `agents/dto/create-agent.dto.ts` (`implements CreateAgentBody`: `name`
     required non-empty trimmed string; `description` optional string |
     null) and `update-agent.dto.ts` (`implements UpdateAgentBody`; all
     optional — `PartialType` or hand-rolled).
3.2. `agents/agents.service.ts`: inject `Repository<Agent>`; methods
     `create`, `findAll` (`ailments` relation, `createdAt ASC`), `findOne`
     (`ailments` + `ailments.recommendedTherapies`; throws
     `NotFoundException`), `update`, `remove` (hard delete; rely on DB
     `onDelete: 'SET NULL'` for ailments, verify it fires).
3.3. `agents/agents.controller.ts`: `POST /agents`, `GET /agents`,
     `GET /agents/:id`, `PATCH /agents/:id`, `DELETE /agents/:id`
     (`@HttpCode(204)`). Responses conform to `AgentResponse` — add a small
     entity→response mapper if the raw entity shape doesn't match (dates as
     ISO strings, relations trimmed).
3.4. Register controller + service in `AgentsModule`; keep the existing
     `TypeOrmModule.forFeature([Agent])` export.

## 4. API — Ailments resource

4.1. `ailments/dto/create-ailment.dto.ts` (`implements CreateAilmentBody`:
     `name` required; `description` optional nullable; `agentId` optional
     uuid) and `update-ailment.dto.ts` (`implements UpdateAilmentBody`; all
     optional, `agentId` may be explicitly `null` to detach).
4.2. `ailments/ailments.service.ts`: inject `Repository<Ailment>` and
     `Repository<Agent>` (add `Agent` to this module's `forFeature`, or import
     `AgentsModule`'s export). Methods `create`, `findAll` (relations `agent`,
     `recommendedTherapies`; `createdAt ASC`), `findOne`, `update`, `remove`.
     Unknown `agentId` → `NotFoundException`.
4.3. `ailments/ailments.controller.ts`: `POST /ailments`, `GET /ailments`,
     `GET /ailments/:id`, `PATCH /ailments/:id`, `DELETE /ailments/:id`
     (`@HttpCode(204)`). Responses conform to `AilmentResponse`.
4.4. Convenience route — `POST /agents/:id/ailments` on the **agents**
     controller (delegates to `AilmentsService.create` with the path id as
     `agentId`). Wire whichever module dependency this needs.
4.5. Register controller + service in `AilmentsModule`.
4.6. Document both resources' routes and response shapes in `api/README.md`
     (module tree table + HTTP surface).

## 5. API — tests

5.1. Service unit tests (`agents/agents.service.spec.ts`,
     `ailments/ailments.service.spec.ts`) using `createTestDataSource()` in
     the Phase 1 style: CRUD happy paths, `404` on missing id, `404` on bad
     `agentId`, agent-delete detaches ailments.
5.2. E2E specs under `vitest.config.e2e.ts`:
     - `test/agents.e2e-spec.ts`: create → list (with ailments) → get → patch
       → `POST /agents/:id/ailments` → delete → confirm `204` and that the
       ailment survives detached.
     - `test/ailments.e2e-spec.ts`: create unattached → attach via patch →
       detach via `patch agentId:null` → delete; `400` on unknown field /
       missing `name`; `404` on missing id.
5.3. Run `npm test` and `npm run test:e2e` in `api/`; full suite (Phases
     1–3) green.

## 6. Frontend — API client

6.1. Extend `src/lib/api.ts`: import `AgentResponse` / `AilmentResponse` /
     the request bodies from `@clinic/types`; add functions `listAgents`,
     `getAgent`, `createAgent`, `updateAgent`, `deleteAgent`, `createAilment`
     (via `POST /agents/:id/ailments`), `updateAilment`, `deleteAilment`.
     Follow the `fetchHealth` pattern (AbortSignal arg, throw on non-2xx,
     `Accept: application/json`); add a JSON-body helper.
6.2. A tiny `useAsync` / `useAgents` hook (or inline `useState`/`useEffect`)
     for load + refetch — no external data lib.

## 7. Frontend — check-in screen (`/agents`)

7.1. Replace `src/app/agents/page.tsx` (remove `ComingSoon`). Build inside the
     shared layout; client component(s) for the interactive parts.
7.2. **Check-in form**: MUI `TextField` (name, required) + optional multiline
     description + submit (≥44px). On success, refetch the list and clear the
     form. Inline validation on empty name; surface API `400`/`500` as an
     `Alert`.
7.3. **Agent list**: MUI `Card`s stacked from `xs`; at `md`+ switch to an MUI
     `Table` (name, description, complaint count, actions) via
     `theme.breakpoints.up('md')` / Tailwind `md:` only. Loading skeleton,
     empty state ("No agents have checked in yet"), error `Alert`. Rows/cards
     link to `/agents/[id]`.

## 8. Frontend — agent detail route (`/agents/[id]`)

8.1. `src/app/agents/[id]/page.tsx` inside the shared layout. Fetch the agent
     via `getAgent`; handle loading / not-found / error.
8.2. Edit agent name/description (`PATCH`).
8.3. Complaints section: add (name + optional description →
     `POST /agents/:id/ailments`), edit (`PATCH /ailments/:id`), delete
     (confirm). Show each complaint's recommended therapies as read-only MUI
     `Chip`s when present.
8.4. Delete agent — confirm dialog; on success `router.push('/agents')`.
8.5. In-universe copy — a line or two, plain text.

## 9. Frontend — tests

9.1. Vitest + RTL specs: mock `fetch` / the `api.ts` functions. Cover — list
     renders from mocked data; empty state; creating an agent triggers the
     create call + refetch; on the detail route, adding a complaint calls the
     convenience route; an API rejection shows an error state.
9.2. Keep the Phase 2 home-page test green. Run `npm test` in `frontend/`.

## 10. Integration & docs wrap-up

10.1. Run `api/` (`npm run start:dev`) and `frontend/` (`npm run dev`)
      together. Walk the full flow: check in an agent, open it, add and edit
      complaints, edit the agent, delete a complaint, delete the agent.
10.2. Stop the API, reload `/agents` and `/agents/[id]` — shell renders, clear
      error state, no crash.
10.3. Manually check `/agents` (cards + `md` table) and `/agents/[id]` at
      ~375px, ~768px, ~1280px: no horizontal scroll, content reflows, touch
      targets ≥44px, forms one-hand usable.
10.4. Update `api/README.md` (module tree + HTTP surface) and
      `apps/agent-health-clinic/README.md` (the `@clinic/types` package +
      setup step; run steps otherwise unchanged).
10.5. Update `apps/agent-health-clinic/CHANGELOG.md` via the `changelog` skill.
10.6. Tick off `validation.md` as items are confirmed, then open for
      review/merge.

## Notes for the implementer

- `frontend/AGENTS.md`: this Next.js (16.x) has breaking changes from training
  data — read the relevant guide under `frontend/node_modules/next/dist/docs/`
  before writing route/page code (dynamic route params — likely an async
  `params` — `metadata`, client vs. server component rules).
- `api/` uses ESM with explicit `.js` import specifiers (`./foo.entity.js`) —
  match the existing style. `@clinic/types` is a bare specifier and needs no
  extension.
- Entities: `Agent.ailments` (`OneToMany`), `Ailment.agent` (`ManyToOne`,
  nullable, `onDelete: 'SET NULL'`), `Ailment.recommendedTherapies`
  (`ManyToMany`, owning side, `ailment_therapy` join table).
- Keep module boundaries: no controller reaches into another module's
  repository except the documented agent↔ailment relation.
- `@clinic/types` must stay runtime-free — types and `type`-only exports only,
  so both `nest build` and `next build` can consume it without bundling code.
