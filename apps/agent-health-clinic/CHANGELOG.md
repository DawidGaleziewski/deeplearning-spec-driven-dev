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
