# Requirements — Agent & Ailment Management

## Context

This is Phase 3 of the [roadmap](../roadmap.md). Phase 1 delivered the core data
model (entities, migrations, seed, repository tests, plus the throwaway `/dev`
UI). Phase 2 stood up the two service shells — a NestJS API with `/health` +
CORS, and a Next.js App Router frontend with MUI + Tailwind, a mobile-first base
layout, and a routing skeleton (`/`, `/agents`, `/dashboard` placeholders).

Phase 3 is the **first real domain surface**: the "patients" and their
complaints become visible and editable. It adds:

- **REST CRUD endpoints** on the NestJS API for `agents` and their `ailments`,
  the first endpoints beyond `/health` — so this phase also sets the REST
  conventions (routes, DTOs, validation, error shape) that Phases 4–6 follow.
- An **agent-facing check-in UI** in Next.js under the existing `/agents` route:
  an agent "checks in" (creates its own record), then logs and edits its
  complaints. Written in the in-universe voice (agents seeking relief from their
  humans), per [mission.md](../mission.md).

Per [tech-stack.md](../tech-stack.md): TypeScript end-to-end, Next.js frontend +
separate NestJS API over HTTP, SQLite/TypeORM, MUI + Tailwind, Vitest,
mobile-first responsive.

## Scope

### In scope

**NestJS API — REST conventions (established here, reused later)**
- Global `ValidationPipe` (`whitelist: true`, `forbidNonWhitelisted: true`,
  `transform: true`) wired in `main.ts`. Add `class-validator` +
  `class-transformer` to `api/`.
- DTO classes per resource for create/update, decorated with `class-validator`.
  `PATCH` (partial update) rather than `PUT`.
- Consistent error responses — Nest's default `HttpException` JSON shape
  (`{ statusCode, message, error }`); `404` for unknown ids, `400` for
  validation failures.
- Resources live in their existing feature modules (`AgentsModule`,
  `AilmentsModule`), each gaining a controller + service. Modules still do not
  reach across each other's entities except through the documented relation
  (an ailment references an agent).
- Routes are unversioned and unprefixed for now (`/agents`, `/ailments`),
  matching `/health`. A global prefix / versioning decision is deferred.

**Agents resource — `/agents`**
- `POST /agents` — create. Body: `name` (required, non-empty, trimmed),
  `description` (optional, nullable).
- `GET /agents` — list all, ordered by `createdAt ASC`. Each item includes its
  `ailments` (id, name, description) so the check-in screen can render an agent
  with its complaints in one call. No pagination/search this phase.
- `GET /agents/:id` — one agent with its `ailments` (and each ailment's
  `recommendedTherapies`, read-only — see below). `404` if missing.
- `PATCH /agents/:id` — update `name` and/or `description`. `404` if missing.
- `DELETE /agents/:id` — hard delete. Returns `204`. The agent's ailments are
  **kept**, with their `agent` FK set to `null` (matches the entity's
  `onDelete: 'SET NULL'`). `404` if missing.

**Ailments resource — `/ailments`**
- `POST /ailments` — create. Body: `name` (required, non-empty, trimmed),
  `description` (optional, nullable), `agentId` (optional — an ailment may be
  logged before it is attached to an agent, matching the entity). If `agentId`
  is given and no such agent exists → `404`.
- `GET /ailments` — list all, ordered by `createdAt ASC`, each with its `agent`
  (id, name) and `recommendedTherapies` (id, name — read-only). No
  pagination/search this phase.
- `GET /ailments/:id` — one ailment with `agent` and `recommendedTherapies`.
  `404` if missing.
- `PATCH /ailments/:id` — update `name`, `description`, and/or `agentId`
  (including setting `agentId: null` to detach). Unknown `agentId` → `404`.
- `DELETE /ailments/:id` — hard delete. Returns `204`. `404` if missing.
- Convenience: `POST /agents/:id/ailments` creates an ailment already attached
  to that agent (same body as `POST /ailments` minus `agentId`). This is the
  call the check-in UI uses for "add a complaint". `404` if the agent is
  missing.

**Recommended therapies — read-only passthrough**
- Ailment responses include `recommendedTherapies` as `{ id, name }[]` when the
  many-to-many rows exist (e.g. from seed data). There is **no** endpoint to
  add/remove that link this phase — it becomes editable in Phase 4 (therapy
  directory). The UI displays them if present and otherwise shows nothing.

**Next.js frontend — agent-facing check-in (`/agents`)**
- Replace the `/agents` "coming soon" placeholder with a working screen, inside
  the Phase 2 shared layout, mobile-first.
- **Check in**: a form to create an agent (`name`, optional `description`).
  Single-column, one-hand usable on a phone, submit target ≥44px.
- **Agent list**: all checked-in agents render as **stacked cards on mobile**;
  a denser layout (e.g. table or multi-column) is allowed at `sm`/`md`
  breakpoints and up (`theme.breakpoints.up` / Tailwind `sm:` only — additive,
  no `max-width` overrides). Each card shows the agent's name, description, and
  its list of complaints.
- **Per-agent detail / edit**: from a card, open the agent (either a
  `/agents/[id]` route or an expand-in-place panel — implementer's choice) to:
  edit the agent's name/description, add a complaint (name + optional
  description), edit a complaint, delete a complaint, and delete the agent
  (with a confirm step). Each ailment shows its recommended therapies if any.
- **Data fetching**: browser-side against `NEXT_PUBLIC_API_BASE_URL`, extending
  `src/lib/api.ts` with typed `agents` / `ailments` client functions in the
  style of the existing `fetchHealth`. No React Query/SWR — plain
  `fetch` + `useState`/`useEffect` (or a small custom hook) is enough for this
  surface. Loading, empty, and error states are all handled (the shell renders
  even if the API is down, matching Phase 2).
- In-universe copy: brief, plain text (voice yes, design pass no — Phase 7).

**Testing**
- API: unit tests for both services (CRUD happy paths + `404`/validation
  edges) using an in-memory SQLite data source in the Phase 1 style, **plus**
  an e2e spec (`agents.e2e-spec.ts` / `ailments.e2e-spec.ts` under the existing
  `vitest.config.e2e.ts`) covering the full lifecycle over HTTP for both
  resources, including the `DELETE` agent → ailment detached behaviour and the
  `POST /agents/:id/ailments` convenience route. Phase 1 + 2 suites stay green.
- Frontend: Vitest + RTL tests for the check-in screen — renders the shell,
  lists agents (mocked API), creates an agent, adds a complaint, and shows an
  error state when the API rejects. `fetch` mocked.
- Responsive check is a **manual validation item** at ~375 / ~768 / ~1280px.

### Out of scope (later phases)

- Therapy catalog endpoints and the editable ailment↔therapy link (Phase 4).
- Booking flow (Phase 5).
- The staff dashboard views for agents/ailments and admin endpoints (Phase 6) —
  `/dashboard` stays a placeholder this phase.
- Auth / sessions / "which agent am I" — the check-in screen is open and
  operates on the whole list; there is no logged-in agent identity yet
  (Phase 6 introduces staff auth; agent identity, if ever, is later).
- Pagination, text search, filtering, sorting controls on the lists.
- Soft delete / archive / audit trail — deletes are hard.
- API versioning, global route prefix, response envelope/pagination format,
  OpenAPI/Swagger — revisit when the surface is larger.
- Removing the Phase 1 `/dev` UI — it stays as-is.
- Visual polish — plain default MUI theme; clean and responsive, not designed
  (Phase 7).

## Decisions

- **Agent-facing check-in surface, not an admin screen.** The roadmap calls
  Phase 3 "the first screen where the patients and their complaints become
  visible"; Phase 6 owns the staff dashboard. Building it in the in-universe
  agent voice now keeps the two audiences separate and avoids pre-empting
  Phase 6's admin UX.
- **Full CRUD, hard delete.** Deleting an agent sets its ailments' `agent` FK to
  `null` rather than cascading — the complaint history is real domain data and
  the entity already declares `onDelete: 'SET NULL'`. Deleting an ailment
  removes it outright. No soft-delete machinery this phase.
- **`class-validator` + global `ValidationPipe` now.** Phase 2's requirements
  explicitly deferred "DTOs, validation, error contracts" to Phase 3. This is
  the phase that sets them, so later resources copy an established pattern
  rather than inventing one.
- **`PATCH` partial updates, Nest default error shape.** Smallest reasonable
  REST surface; no custom error envelope until there's a reason for one.
- **`recommendedTherapies` read-only.** Therapies have no real endpoints until
  Phase 4, so the link can be shown (from seed data) but not edited yet —
  avoids shipping a half-endpoint that Phase 4 rewrites.
- **`POST /agents/:id/ailments` convenience route** mirrors the existing
  `/dev` helper and is what the "add a complaint" button actually calls;
  `POST /ailments` with an `agentId` stays for completeness.
- **No client data-fetching library.** One list + a handful of mutations does
  not justify React Query/SWR; Phase 2 already decided this. Revisit if a later
  phase needs shared caching.
- **Lists are unpaginated.** Seed/demo data volume is tiny; search + pagination
  are a Phase 6 concern when the staff dashboard needs to scan real volume.
- **`/dev` UI untouched.** It is still a useful manual poke-around surface and
  removing it is not free (its e2e test, `public/index.html`); defer until a
  phase makes it clearly redundant.

## Open questions

- `/agents/[id]` route vs. expand-in-place for the detail/edit view — left to
  the implementer; both satisfy the mobile-first requirement. If a route is
  added it is still inside the Phase 2 shell.
- Whether to extract a shared `@clinic/types` package for the API response
  shapes now that there are real ones — still deferred (Phase 2 open question);
  hand-written interfaces in `src/lib/api.ts` are fine for one consumer.
- Exact wider-breakpoint layout for the agent list (table vs. columns) — a
  validation checks responsiveness, not a specific layout.
