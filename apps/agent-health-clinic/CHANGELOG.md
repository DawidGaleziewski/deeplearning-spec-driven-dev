# Changelog

All notable changes to **agent-health-clinic** are recorded here, newest date first.
Update it via the `changelog` skill before merging a branch.

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
