# Changelog

All notable changes to **agent-health-clinic** are recorded here, newest date first.
Update it via the `changelog` skill before merging a branch.

## 2026-08-30

- Implemented Phase 4 (containerization & one-command run) from `specs/2026-08-30-containerization/`. No product behaviour changes — packaging and developer/testing ergonomics only.
- Added multi-stage `api/Dockerfile` and `frontend/Dockerfile` (base `node:24-slim`, non-root runtime, no build toolchain in the final image). The API image runs the compiled output via an entrypoint; the frontend image serves the Next.js standalone production server, never `next dev`.
- Added a root `docker-compose.yml`: `docker compose up --build` from the app root brings up the API on `3000` and the frontend on `3001` at <http://localhost:3001>, with the SQLite database on a named volume. `FRONTEND_ORIGIN` and `NEXT_PUBLIC_API_BASE_URL` are derived from the `API_PORT` / `FRONTEND_PORT` knobs so CORS and the browser's API URL can't desync.
- API container entrypoint runs pending migrations on every start, then seeds **only if the database is empty** — UI-created data survives `docker compose down` + `up`; `docker compose down -v` returns to clean demo data. `/dev` is off in the container (`NODE_ENV=production`).
- API: refactored `src/seed/seed.ts` to export a reusable `seed()` function (self-runs only when invoked directly); added `src/seed/seed-if-empty.ts` and the `db:seed:if-empty` npm script. `npm run seed` / `npm run db:reset` behaviour unchanged.
- Frontend: `next.config.ts` gains `output: "standalone"` and `outputFileTracingRoot` at the app root (for the sibling `packages/types`); `transpilePackages` unchanged. Added `frontend/public/.gitkeep` so the (otherwise empty, untracked) directory exists in a fresh checkout's build context.
- Docker builds install `typescript` globally in the build stages: `npm ci` runs the `@clinic/types` `prepare` (`tsc`) script (a local `npm install` symlinks and skips it), which would otherwise fail. Not present in either runtime image.
- Added `.env.example` (two port knobs), app-root `.gitignore` (ignores `.env` / `docker-compose.override.yml`), `.dockerignore`, and a `Makefile` with `up` / `down` / `clean` / `logs` / `seed` / `reset` / `build` aliases over compose.
- Added a repo-root GitHub Actions workflow (`.github/workflows/agent-health-clinic-docker.yml`) that builds both images (Buildx bake, `type=gha` cache) and runs a cross-service smoke test on PRs touching `apps/agent-health-clinic/**`: waits for both the API and frontend healthchecks, checks liveness of `/` and `/health`, and asserts `GET /agents` with an `Origin` header returns a matching `Access-Control-Allow-Origin` plus the seeded agents; always `down -v`, dumps logs on failure.
- Docs: README gains a "Run with Docker" section alongside the two-terminal flow; `api/README.md` documents the container entrypoint and `db:seed:if-empty`.

## 2026-08-29

- Implemented Phase 2 (app shells) from `specs/2026-08-29-app-shells/`.
- API: added a dedicated `HealthModule` with `GET /health` returning `{ status, uptime, timestamp }` and no database access; registered it in `AppModule`. `GET /` hello string unchanged.
- API: enabled CORS in `main.ts` with the allowed origin from `FRONTEND_ORIGIN` (default `http://localhost:3001`).
- API: added `test/health.e2e-spec.ts` covering `GET /health` and the unchanged `GET /`; documented the module tree and env vars in `api/README.md`.
- Frontend: new standalone `frontend/` package — Next.js App Router + TypeScript, MUI (App Router SSR emotion cache, shared theme with breakpoints, `CssBaseline`), and Tailwind with `preflight` disabled.
- Frontend: mobile-first base layout (sticky header, fluid `Container`, viewport metadata), a routing skeleton (`/agents`, `/dashboard` stubs), and a home page that round-trips `GET /health` browser-side against `NEXT_PUBLIC_API_BASE_URL` with pending / success / error states.
- Frontend: Vitest + React Testing Library set up with home-page tests for the success and error states.
- Updated `apps/agent-health-clinic/README.md` with install/run steps, ports, and env vars for both services.
- Implemented Phase 3 (agent & ailment management) from `specs/2026-08-29-agent-ailment-management/`.
- Added `packages/types` (`@clinic/types`) — a shared, runtime-free package of API request/response shapes, consumed by both `api/` and `frontend/` via a `file:` dependency (compiled output committed; frontend adds it to `transpilePackages`).
- API: full REST CRUD for agents (`/agents`, `/agents/:id`) and ailments (`/ailments`, `/ailments/:id`), plus a `POST /agents/:id/ailments` check-in shortcut. Deleting an agent hard-deletes it but keeps its ailments, detached (`agent: null`). Recommended therapies are read-only on ailment responses this phase.
- API: added a global `ValidationPipe` (`whitelist` + `forbidNonWhitelisted` + `transform`) via `src/app-config.ts`, shared with the e2e harness; DTOs implement the `@clinic/types` request shapes and UUID path params are validated. Added `class-validator` / `class-transformer`.
- API: added service unit tests and `agents` / `ailments` e2e specs; documented the new endpoints and response shapes in `api/README.md`.
- Frontend: `/agents` is now the agent-facing check-in screen — a check-in form plus the waiting-room roster (stacked cards on mobile, a table from the `md` breakpoint). New `/agents/[id]` chart route to edit an agent, log/edit/delete complaints (with confirm dialogs), and discharge the agent.
- Frontend: extended `src/lib/api.ts` with typed agent/ailment client functions and an `ApiError`; added a `useAsync` loading hook, a reusable `ConfirmDialog`, and Vitest + RTL tests for the check-in screen and the chart route.

## 2026-08-28

- Implemented the Phase 1 core data model in the NestJS API: `Agent`, `Ailment`, `Therapy`, and `Booking` entities with their relationships, plus a `BookingStatus` type.
- Added the initial TypeORM migration (`InitialSchema`) and migration runner / revert scripts, backed by a dedicated data source.
- Added repository unit tests for agents, ailments, therapies, and bookings, with a separate test data source.
- Added a seed script and a `/dev` controller/module for populating and inspecting local data.
- Added a static API landing page and expanded the e2e test suite.
- Expanded the core-data-model spec (requirements, plan, validation).

## 2026-08-27

- Scaffolded the NestJS API service: module structure, SQLite + TypeORM wiring, health-check controller, Vitest unit and e2e config.
- Added the first feature spec set under `specs/2026-08-27-core-data-model/` (requirements, plan, validation).

## 2026-08-26

- Seeded the project constitution: `specs/mission.md`, `specs/roadmap.md`, `specs/tech-stack.md`, and the app README.
