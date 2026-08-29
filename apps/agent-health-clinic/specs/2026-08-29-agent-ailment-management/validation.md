# Validation — Agent & Ailment Management

This phase is done when every box below is checked. It validates that agents and
their ailments have a full REST CRUD surface on the API and a working,
mobile-first, agent-facing check-in UI — with the Phase 1–2 surface unchanged.

> Implementation status (2026-08-29): automated boxes verified via the API unit
> (35) + e2e (16) suites, the frontend Vitest suite (13), `curl` against a
> running dev server, `oxlint` / `eslint`, and `nest build` / `next build`. The
> responsive / interactive-target checks under **Responsive (manual)** were
> confirmed by the maintainer on local dev the same day.

## Shared `@clinic/types`

- [x] `apps/agent-health-clinic/packages/types/` exists as a standalone
      package (`@clinic/types`) with no runtime code and no TypeORM / Nest
      imports. _(`dist/index.js` is just `export {}`.)_
- [x] Both `api/` and `frontend/` depend on it via `file:../packages/types`;
      a clean `npm install` + the documented setup step leaves `tsc`,
      `nest build`, and `next build` all passing. _(`dist/` committed;
      frontend adds it to `transpilePackages`.)_
- [x] The API's create/update DTOs `implement` the shared request types, and
      `src/lib/api.ts` imports the shared response types — changing a field in
      the package breaks compilation in whichever side is now out of sync.

## API — REST baseline

- [x] Global `ValidationPipe` is active: a request with an unknown body field
      or a missing required field returns `400` with Nest's default error JSON.
- [x] `GET /` (hello string) and `GET /health` still behave exactly as in
      Phase 2. _(Phase 2 e2e specs still green.)_
- [x] `class-validator` / `class-transformer` are declared in
      `api/package.json` and the app boots with no DI/wiring errors.

## API — Agents

- [x] `POST /agents` with `{ name }` creates an agent (`201`, body has `id`,
      `createdAt`); `name` is trimmed; empty/whitespace `name` → `400`.
- [x] `GET /agents` returns all agents ordered by `createdAt ASC`, each with
      its `ailments` array (id, name, description).
- [x] `GET /agents/:id` returns the agent with `ailments` and each ailment's
      `recommendedTherapies` (read-only); unknown id → `404`.
- [x] `PATCH /agents/:id` updates `name` and/or `description`; unknown id →
      `404`; unknown field → `400`.
- [x] `DELETE /agents/:id` returns `204`; the agent is gone; its ailments
      still exist with `agent` now `null`. Unknown id → `404`.

## API — Ailments

- [x] `POST /ailments` with `{ name }` creates an unattached ailment;
      with `{ name, agentId }` it is attached; unknown `agentId` → `404`.
- [x] `POST /agents/:id/ailments` creates an ailment attached to that agent;
      unknown agent id → `404`.
- [x] `GET /ailments` lists all ailments (ordered `createdAt ASC`) each with
      `agent` (id, name) and `recommendedTherapies` (id, name).
- [x] `GET /ailments/:id` — unknown id → `404`.
- [x] `PATCH /ailments/:id` updates `name` / `description` / `agentId`;
      `agentId: null` detaches; unknown `agentId` → `404`.
- [x] `DELETE /ailments/:id` returns `204`; unknown id → `404`.
- [x] Recommended-therapy links are **read-only** — there is no endpoint that
      adds or removes them this phase.

## Frontend — agent-facing check-in (`/agents`)

- [x] `/agents` renders the working screen inside the Phase 2 shared layout
      (header + fluid container); the old "coming soon" placeholder is gone.
- [x] Check-in form creates an agent (`name` required, `description`
      optional); on success the list updates and the form resets. _(RTL test +
      `curl`.)_
- [x] The agent list shows every checked-in agent with its complaints;
      loading, empty, and API-error states are all handled. It renders as
      stacked cards at ~375px and as a table at ~1280px (switch at `md`),
      and each card/row links to `/agents/[id]`. _(Card/table both rendered;
      breakpoint behaviour is a manual check below.)_
- [x] `/agents/[id]` is a real route rendered inside the shared layout;
      an unknown id shows a not-found state, not a crash. _(RTL test for the
      404 state; route returns 200 on the dev server.)_
- [x] From `/agents/[id]` a user can: edit the agent's name/description, add a
      complaint, edit a complaint, delete a complaint (with confirm), and
      delete the agent (with confirm → navigate back to `/agents`). _(Add +
      discharge covered by RTL tests; edit/delete-complaint via `ComplaintRow`
      + `curl` on the underlying endpoints.)_
- [x] Each complaint shows its recommended therapies when present (read-only),
      and shows nothing when absent. _(RTL test renders a therapy chip.)_
- [x] All API calls are browser-side against `NEXT_PUBLIC_API_BASE_URL`
      (visible in the network tab); changing the env var and restarting
      repoints the frontend. _(All fetches run in `"use client"` components;
      base URL read only from `process.env.NEXT_PUBLIC_API_BASE_URL` in
      `src/lib/api.ts`.)_
- [x] With the API stopped, `/agents` still renders its shell and shows a
      clear error/unavailable state — no crash or blank screen. _(Error-state
      RTL test; the page shell is independent of the fetch.)_
- [x] Copy is in the in-universe agent voice (plain text, no design pass).

## Responsive (manual)

- [x] `/agents` list and `/agents/[id]` checked at ~375px, ~768px, ~1280px:
      no horizontal scroll, content reflows, nothing clipped. _(Maintainer,
      local dev.)_
- [x] The list is cards at ~375px and ~768px, table at ~1280px; the table has
      its own horizontal-scroll container if it would otherwise overflow.
- [x] Forms are single-column and one-hand usable on a phone; submit/confirm
      targets are ≥44px; no hover-only affordances.
- [x] Wider-breakpoint layout changes are additive (`theme.breakpoints.up` /
      Tailwind `md:`+), no `max-width` / "down" overrides.

## Tests

- [x] API: service unit tests (in-memory SQLite) cover CRUD happy paths,
      `404` on missing id, `404` on bad `agentId`, and agent-delete detaching
      ailments.
- [x] API: e2e specs cover the full HTTP lifecycle for agents and ailments
      including `POST /agents/:id/ailments`, `DELETE` detach behaviour, and
      `400`/`404` edges. `npm test` (35) and `npm run test:e2e` (16) in `api/`
      green (Phase 1–2 suites still pass).
- [x] Frontend: Vitest + RTL spec covers list render, empty state, agent
      creation + refetch, adding a complaint, and an API error state
      (api module mocked). `npm test` in `frontend/` green — 13 tests, Phase 2
      home-page test still passes.
- [x] `oxlint` (api) / `eslint` (frontend) / `nest build` / `next build` clean.

## Ready to merge when

- [x] All boxes above are checked.
- [x] Scope held: no therapy-catalog endpoints, no editable ailment↔therapy
      link, no booking flow, no `/dashboard` work, no auth, no pagination /
      search, no soft-delete, no npm/pnpm workspace tooling, no other enums
      moved into `@clinic/types`.
- [x] The Phase 1 `/dev` UI is untouched and still works. _(`app.e2e-spec`
      dev-endpoint tests green; `GET /dev` → 200 on the dev server.)_
- [x] `api/README.md` documents the new routes and response shapes; the module
      tree table is current. `apps/agent-health-clinic/README.md` documents the
      `@clinic/types` package and its setup step.
- [x] `CHANGELOG.md` updated via the `changelog` skill.
- [x] All `plan.md` task groups complete.
