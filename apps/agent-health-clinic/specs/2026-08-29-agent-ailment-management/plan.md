# Plan — Agent & Ailment Management

Task groups roughly in dependency order. Group 1 sets the REST conventions;
groups 2–3 (API resources) unblock groups 5–7 (frontend) once the response
shapes are stable. Groups 2 and 3 can proceed in parallel after group 1.

## 1. API — validation & REST baseline

1.1. Add `class-validator` and `class-transformer` to `api/package.json`;
     install.
1.2. In `main.ts`, register a global `ValidationPipe({ whitelist: true,
     forbidNonWhitelisted: true, transform: true })`. Leave CORS / `PORT`
     untouched.
1.3. Add a `src/common/` home for shared DTO helpers if needed (e.g. a
     trimming transform). Keep it minimal — only what groups 2–3 actually use.
1.4. Sanity-check that `GET /` and `GET /health` still respond unchanged with
     the pipe active (they take no body).

## 2. API — Agents resource

2.1. `agents/dto/create-agent.dto.ts` (`name` required non-empty string,
     trimmed; `description` optional string, nullable) and
     `update-agent.dto.ts` (all optional — `PartialType` or hand-rolled).
2.2. `agents/agents.service.ts`: inject `Repository<Agent>`; methods
     `create`, `findAll` (with `ailments` relation, `createdAt ASC`),
     `findOne` (with `ailments` + `ailments.recommendedTherapies`, throws
     `NotFoundException`), `update`, `remove` (hard delete; rely on DB
     `onDelete: 'SET NULL'` for ailments, verify it fires).
2.3. `agents/agents.controller.ts`: `POST /agents`, `GET /agents`,
     `GET /agents/:id`, `PATCH /agents/:id`, `DELETE /agents/:id`
     (`@HttpCode(204)`).
2.4. Register controller + service in `AgentsModule`; keep the existing
     `TypeOrmModule.forFeature([Agent])` export.
2.5. Define the serialized response shape (plain entity is fine if relations
     are shaped correctly; otherwise a small mapper). Document it in
     `api/README.md`.

## 3. API — Ailments resource

3.1. `ailments/dto/create-ailment.dto.ts` (`name` required; `description`
     optional nullable; `agentId` optional uuid) and `update-ailment.dto.ts`
     (all optional, `agentId` may be explicitly `null` to detach).
3.2. `ailments/ailments.service.ts`: inject `Repository<Ailment>` and
     `Repository<Agent>` (for `agentId` resolution — this module already may
     import `AgentsModule`'s `TypeOrmModule` export, or add `Agent` to its own
     `forFeature`). Methods `create`, `findAll` (relations `agent`,
     `recommendedTherapies`; `createdAt ASC`), `findOne`, `update`, `remove`.
     Unknown `agentId` → `NotFoundException`.
3.3. `ailments/ailments.controller.ts`: `POST /ailments`, `GET /ailments`,
     `GET /ailments/:id`, `PATCH /ailments/:id`, `DELETE /ailments/:id`
     (`@HttpCode(204)`).
3.4. Convenience route — `POST /agents/:id/ailments` on the **agents**
     controller (delegates to `AilmentsService.create` with the path id as
     `agentId`). Wire whichever module dependency this needs.
3.5. Register controller + service in `AilmentsModule`.
3.6. Document the ailment response shape and both routes in `api/README.md`
     (module tree table + HTTP surface).

## 4. API — tests

4.1. Service unit tests (`agents/agents.service.spec.ts`,
     `ailments/ailments.service.spec.ts`) using `createTestDataSource()` in
     the Phase 1 style: CRUD happy paths, `404` on missing id, `404` on bad
     `agentId`, agent-delete detaches ailments, validation is covered at e2e.
4.2. E2E specs under `vitest.config.e2e.ts`:
     - `test/agents.e2e-spec.ts`: create → list (with ailments) → get → patch
       → `POST /agents/:id/ailments` → delete → confirm `204` and that the
       ailment survives detached.
     - `test/ailments.e2e-spec.ts`: create unattached → attach via patch →
       detach via `patch agentId:null` → delete; `400` on unknown field /
       missing `name`; `404` on missing id.
4.3. Run `npm test` and `npm run test:e2e` in `api/`; full suite (Phases
     1–3) green.

## 5. Frontend — API client

5.1. Extend `src/lib/api.ts` with typed interfaces (`Agent`, `Ailment`,
     `Therapy` summary) and functions: `listAgents`, `getAgent`, `createAgent`,
     `updateAgent`, `deleteAgent`, `createAilment` (via
     `POST /agents/:id/ailments`), `updateAilment`, `deleteAilment`. Follow
     the existing `fetchHealth` pattern (AbortSignal arg, throw on non-2xx,
     `Accept: application/json`). Add a JSON body helper.
5.2. A tiny `useAsync` / `useAgents` hook (or inline `useState`/`useEffect`)
     for load + refetch — no external data lib.

## 6. Frontend — check-in screen

6.1. Replace `src/app/agents/page.tsx` (remove `ComingSoon`). Build inside the
     shared layout. Client component(s) for the interactive parts.
6.2. **Check-in form**: MUI `TextField` (name, required) + optional
     multiline description + submit button (≥44px). On success, refetch the
     list and clear the form. Inline validation message on empty name;
     surface API `400`/`500` as an `Alert`.
6.3. **Agent list**: stacked MUI `Card`s on mobile; at `sm`+ a denser layout
     (`Grid`/table) via `theme.breakpoints.up` or Tailwind `sm:` only. Each
     card: name, description, complaint count / list. Loading skeleton, empty
     state ("No agents have checked in yet"), error `Alert`.
6.4. **Detail / edit** (`/agents/[id]` route or expand-in-place):
     - edit agent name/description (`PATCH`),
     - add complaint (name + optional description → `POST /agents/:id/ailments`),
     - edit complaint (`PATCH /ailments/:id`), delete complaint (confirm),
     - delete agent (confirm dialog; on success return to list),
     - show each complaint's recommended therapies if present (read-only chips).
6.5. In-universe copy — a line or two, plain text.

## 7. Frontend — tests

7.1. Vitest + RTL spec for the check-in screen: mock `fetch` / the `api.ts`
     functions; assert list renders from mocked data, an empty state,
     creating an agent triggers the create call + refetch, adding a complaint
     calls the convenience route, and an API rejection shows an error state.
7.2. Keep the Phase 2 home-page test green. Run `npm test` in `frontend/`.

## 8. Integration & docs wrap-up

8.1. Run `api/` (`npm run start:dev`) and `frontend/` (`npm run dev`)
     together. Walk the full flow in the browser: check in an agent, add and
     edit complaints, edit the agent, delete a complaint, delete the agent.
8.2. Stop the API, reload `/agents` — shell renders, clear error state, no
     crash.
8.3. Manually check `/agents` (list + detail/edit) at ~375px, ~768px,
     ~1280px: no horizontal scroll, content reflows, touch targets ≥44px,
     forms one-hand usable.
8.4. Update `api/README.md` (module tree + HTTP surface tables, env vars
     unchanged) and `apps/agent-health-clinic/README.md` if run steps change
     (they should not).
8.5. Update `apps/agent-health-clinic/CHANGELOG.md` via the `changelog` skill.
8.6. Tick off `validation.md` as items are confirmed, then open for
     review/merge.

## Notes for the implementer

- `frontend/AGENTS.md`: this Next.js (16.x) has breaking changes from training
  data — read the relevant guide under `frontend/node_modules/next/dist/docs/`
  before writing route/page code (dynamic route params, `metadata`, client vs.
  server component rules).
- `api/` uses ESM with explicit `.js` import specifiers (`./foo.entity.js`) —
  match the existing style.
- Entities: `Agent.ailments` (`OneToMany`), `Ailment.agent` (`ManyToOne`,
  nullable, `onDelete: 'SET NULL'`), `Ailment.recommendedTherapies`
  (`ManyToMany`, owning side with `ailment_therapy` join table).
- Keep module boundaries: no controller reaches into another module's
  repository except the documented agent↔ailment relation.
