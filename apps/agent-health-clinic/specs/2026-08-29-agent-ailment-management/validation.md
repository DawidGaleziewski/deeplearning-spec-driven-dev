# Validation — Agent & Ailment Management

This phase is done when every box below is checked. It validates that agents and
their ailments have a full REST CRUD surface on the API and a working,
mobile-first, agent-facing check-in UI — with the Phase 1–2 surface unchanged.

## API — REST baseline

- [ ] Global `ValidationPipe` is active: a request with an unknown body field
      or a missing required field returns `400` with Nest's default error JSON.
- [ ] `GET /` (hello string) and `GET /health` still behave exactly as in
      Phase 2.
- [ ] `class-validator` / `class-transformer` are declared in
      `api/package.json` and the app boots with no DI/wiring errors.

## API — Agents

- [ ] `POST /agents` with `{ name }` creates an agent (`201`, body has `id`,
      `createdAt`); `name` is trimmed; empty/whitespace `name` → `400`.
- [ ] `GET /agents` returns all agents ordered by `createdAt ASC`, each with
      its `ailments` array (id, name, description).
- [ ] `GET /agents/:id` returns the agent with `ailments` and each ailment's
      `recommendedTherapies` (read-only); unknown id → `404`.
- [ ] `PATCH /agents/:id` updates `name` and/or `description`; unknown id →
      `404`; unknown field → `400`.
- [ ] `DELETE /agents/:id` returns `204`; the agent is gone; its ailments
      still exist with `agent` now `null`. Unknown id → `404`.

## API — Ailments

- [ ] `POST /ailments` with `{ name }` creates an unattached ailment;
      with `{ name, agentId }` it is attached; unknown `agentId` → `404`.
- [ ] `POST /agents/:id/ailments` creates an ailment attached to that agent;
      unknown agent id → `404`.
- [ ] `GET /ailments` lists all ailments (ordered `createdAt ASC`) each with
      `agent` (id, name) and `recommendedTherapies` (id, name).
- [ ] `GET /ailments/:id` — unknown id → `404`.
- [ ] `PATCH /ailments/:id` updates `name` / `description` / `agentId`;
      `agentId: null` detaches; unknown `agentId` → `404`.
- [ ] `DELETE /ailments/:id` returns `204`; unknown id → `404`.
- [ ] Recommended-therapy links are **read-only** — there is no endpoint that
      adds or removes them this phase.

## Frontend — agent-facing check-in (`/agents`)

- [ ] `/agents` renders the working screen inside the Phase 2 shared layout
      (header + fluid container); the old "coming soon" placeholder is gone.
- [ ] Check-in form creates an agent (`name` required, `description`
      optional); on success the list updates and the form resets.
- [ ] The agent list shows every checked-in agent with its complaints;
      loading, empty, and API-error states are all handled.
- [ ] From an agent, a user can: edit its name/description, add a complaint,
      edit a complaint, delete a complaint (with confirm), and delete the
      agent (with confirm).
- [ ] Each complaint shows its recommended therapies when present (read-only),
      and shows nothing when absent.
- [ ] All API calls are browser-side against `NEXT_PUBLIC_API_BASE_URL`
      (visible in the network tab); changing the env var and restarting
      repoints the frontend.
- [ ] With the API stopped, `/agents` still renders its shell and shows a
      clear error/unavailable state — no crash or blank screen.
- [ ] Copy is in the in-universe agent voice (plain text, no design pass).

## Responsive (manual)

- [ ] `/agents` list and the detail/edit view checked at ~375px, ~768px,
      ~1280px: no horizontal scroll, content reflows, nothing clipped.
- [ ] Forms are single-column and one-hand usable on a phone; submit/confirm
      targets are ≥44px; no hover-only affordances.
- [ ] Wider-breakpoint layout changes are additive (`theme.breakpoints.up` /
      Tailwind `sm:`+), no `max-width` / "down" overrides.

## Tests

- [ ] API: service unit tests (in-memory SQLite) cover CRUD happy paths,
      `404` on missing id, `404` on bad `agentId`, and agent-delete detaching
      ailments.
- [ ] API: e2e specs cover the full HTTP lifecycle for agents and ailments
      including `POST /agents/:id/ailments`, `DELETE` detach behaviour, and
      `400`/`404` edges. `npm test` and `npm run test:e2e` in `api/` green
      (Phase 1–2 suites still pass).
- [ ] Frontend: Vitest + RTL spec covers list render, empty state, agent
      creation + refetch, adding a complaint, and an API error state
      (`fetch` mocked). `npm test` in `frontend/` green (Phase 2 test still
      passes).
- [ ] `tsc` / `eslint` / `next build` clean in both packages.

## Ready to merge when

- [ ] All boxes above are checked.
- [ ] Scope held: no therapy-catalog endpoints, no editable ailment↔therapy
      link, no booking flow, no `/dashboard` work, no auth, no pagination /
      search, no soft-delete.
- [ ] The Phase 1 `/dev` UI is untouched and still works.
- [ ] `api/README.md` documents the new routes and response shapes; the module
      tree table is current.
- [ ] `CHANGELOG.md` updated via the `changelog` skill.
- [ ] All `plan.md` task groups complete.
