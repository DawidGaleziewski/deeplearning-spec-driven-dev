# Requirements — App Shells

## Context

This is Phase 2 of the [roadmap](../roadmap.md). Phase 1 delivered the core data model inside the NestJS service (entities, migrations, seed, repository tests, plus a throwaway `/dev` test UI). Phase 2 stands up the two real service shells so every later phase has somewhere to add endpoints and screens:

- the **NestJS API** as a proper standalone service — module structure, DI wiring, a real health-check endpoint, CORS for the browser;
- the **Next.js frontend** — TypeScript, App Router, MUI + Tailwind, a mobile-first base layout, and a routing skeleton.

A minimal home page that round-trips through the API health-check proves the two-service stack works end to end and renders correctly from ~375px up. Per [mission.md](../mission.md) the domain is a clinic whose patients are AI agents; per [tech-stack.md](../tech-stack.md) the stack is TypeScript end-to-end, Next.js frontend + separate NestJS API, SQLite/TypeORM, MUI + Tailwind, Vitest.

This phase is **shells only** — no domain screens, no CRUD endpoints, no auth. Those start in Phase 3.

## Scope

### In scope

**Repo layout & tooling**
- New `apps/agent-health-clinic/frontend/` directory holding the Next.js app, a sibling to `api/`.
- `frontend/` and `api/` are **standalone** packages — each with its own `package.json`, dependencies, scripts, and lockfile. No root workspace/monorepo tooling is added in this phase. They are started independently (two processes / two terminals).
- Update `apps/agent-health-clinic/README.md` with how to install and run each service, the ports they use, and the env vars each reads.

**NestJS API shell**
- Confirm/refine the module tree: `AppModule` composing the feature modules (`agents`, `ailments`, `therapies`, `bookings`, `database`, and `dev` when enabled). Document the intended module boundaries.
- Add a dedicated **`GET /health`** endpoint returning JSON (e.g. `{ "status": "ok" }`, optionally an uptime/timestamp field). It lives in its own `health` module/controller and does **not** touch the database (liveness, not readiness).
- Keep the existing `GET /` hello-string behaviour unchanged (the Phase 1 e2e test and `/dev` page depend on it).
- Enable **CORS** via `app.enableCors(...)` in `main.ts`, with the allowed origin read from an env var (e.g. `FRONTEND_ORIGIN`, default `http://localhost:3001`).
- API listen port is env-configurable (`PORT`, default `3000`, matching Phase 1).

**Next.js frontend shell**
- Latest stable **Next.js with the App Router**, TypeScript, ESLint.
- **MUI** as the component library: a shared theme with `theme.breakpoints` configured, an App Router-compatible SSR setup (emotion cache / `ThemeProvider` in the root layout), and `CssBaseline`.
- **Tailwind CSS** for spacing/layout utilities, with **`preflight` disabled** so it does not fight MUI's `CssBaseline` (per [tech-stack.md](../tech-stack.md#ui)).
- **Mobile-first base layout** in the root layout: responsive viewport meta, a fluid `Container`, an app header/shell that works from ~375px up, no horizontal scroll. This layout is the one every later screen inherits — it is not revisited for responsiveness in Phase 7.
- **Routing skeleton**: the root route (`/`) home page, plus placeholder route segments for the areas later phases fill in — at minimum an agent-facing area and a staff `dashboard` area (e.g. `/dashboard`), each rendering a stub "coming soon" page using the shared layout. Exact segment names can be adjusted later; the point is the skeleton exists.
- **Home page round-trip**: on load, the home page fetches `GET {API}/health` and displays the result (e.g. "API: ok" vs. an error state). The API base URL is read from an env var (`NEXT_PUBLIC_API_BASE_URL`, default `http://localhost:3000`). The fetch happens **browser-side** so the round-trip exercises CORS (a Client Component or a client effect); a hard-coded fallback UI renders if the API is down.
- Frontend dev port is `3001` (so both services can run at once); configurable.

**Testing**
- API: a Vitest **e2e spec** covering `GET /health` (200 + expected JSON shape) and confirming `GET /` still returns the hello string. Extend the existing `test/app.e2e-spec.ts` or add a `health.e2e-spec.ts` under the same `vitest.config.e2e.ts`.
- Frontend: Vitest set up (`vitest.config.ts`) with at least one **component/render test** — the home page renders its shell and shows a loading/subsequent state for the health check, with the API call mocked. React Testing Library for rendering.
- Responsive check is a **manual validation item** (see validation.md) at ~375 / ~768 / ~1280px — no automated visual testing this phase.

### Out of scope (later phases)

- Any domain screens or data display — agents, ailments, therapies, bookings lists/forms (Phase 3+).
- CRUD / REST endpoint design beyond `/health` — resources, DTOs, validation, error contracts, pagination, versioning (Phase 3+). REST-vs-GraphQL is effectively settled as REST by adding a plain HTTP endpoint here, but the real API surface is Phase 3's call.
- Auth, sessions, users, staff login (Phase 6).
- Visual polish — final typography, palette, branding, copy voice (Phase 7). Phase 2 uses a plain default MUI theme; it only has to be clean and responsive, not designed.
- Removing or replacing the Phase 1 `/dev` test UI — it stays until a later phase makes it redundant.
- Root monorepo tooling (npm/pnpm workspaces, Turborepo), Docker, CI pipelines, deployment config.
- Data fetching for real domain data, caching strategy, React Query/SWR — not needed for a single health-check call.

## Decisions

- **`frontend/` sibling, standalone packages.** Keeps Phase 2 small — no workspace hoisting, lockfile, or shared-tooling decisions to make now. A monorepo layout can be introduced later as its own change if the duplication becomes painful.
- **Dedicated `GET /health` endpoint, DB-independent.** A separate endpoint (not reusing `GET /`) gives later phases a stable liveness probe and keeps the health contract explicit as JSON. `@nestjs/terminus` is deliberately **not** adopted yet — a hand-rolled controller is enough for one liveness check; Terminus can be added when there are real dependencies (DB, external services) worth reporting readiness on.
- **CORS enabled in NestJS, browser calls the API directly.** Matches the tech-stack's "two services communicating over HTTP" and makes the round-trip actually exercise cross-origin config. Origin is env-driven so it is not hard-coded to localhost.
- **App Router + MUI + Tailwind.** App Router is the current Next.js default; MUI's App Router SSR guide covers the emotion-cache setup. Tailwind `preflight` off per tech-stack. Pages Router was considered (simpler MUI SSR) but rejected to stay on the supported default.
- **Health fetch runs browser-side.** The mission cares about the mobile round-trip demo; doing the fetch client-side proves CORS + the public API URL env var work, which a server-only fetch would hide. The home page still renders fully (shell + a pending/failed state) if the API is unreachable.
- **Ports: API 3000, frontend 3001**, both env-overridable, so `npm run start:dev` in each directory just works side by side.
- **Base layout is the responsive baseline.** Per the roadmap's cross-cutting note, the shell is mobile-first now; Phase 7 refines look only. Every later screen builds inside this layout.
- **Minimal routing skeleton, names not final.** Stub route segments exist so later phases add pages rather than infrastructure; exact URLs (`/dashboard`, agent area) can change without breaking this phase.

## Open questions

- Exact route-segment names for the agent-facing vs. staff areas — deferred to Phase 3/6 when the screens are designed. Phase 2 only needs placeholder segments that render in the shared layout.
- Whether a shared TypeScript "API types" package is worth extracting — revisit in Phase 3 when the first real endpoints and their response shapes exist. Not needed for `/health`.
