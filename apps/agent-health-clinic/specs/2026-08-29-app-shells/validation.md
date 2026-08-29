# Validation — App Shells

This phase is done when every box below is checked. It validates that both service shells exist, run independently, and round-trip a health check end to end, with a mobile-first base layout — no domain features.

> Implementation status (2026-08-29): automated boxes verified via the test
> suites, `curl` against both running dev servers, and `next build` / `tsc` /
> `eslint`. The browser round-trip and responsive/interactive-target items were
> confirmed manually by the maintainer on local dev the same day.

## NestJS API shell

- [x] `GET /health` returns 200 with JSON of the agreed shape (`{ status: "ok", ... }`) and does not query the database.
- [x] `GET /` still returns the Phase 1 hello string (unchanged).
- [x] The app boots with all feature modules registered including `HealthModule` — no DI/wiring errors.
- [x] CORS is enabled for the frontend origin from an env var (`FRONTEND_ORIGIN`); a browser request from the frontend port succeeds and a disallowed origin is rejected. _(`Access-Control-Allow-Origin: http://localhost:3001` returned; requests from other origins get no matching ACAO and are blocked by the browser.)_
- [x] Listen port is configurable via `PORT` (default `3000`).
- [x] `api/README.md` documents the module tree and the env vars the service reads.

## Next.js frontend shell

- [x] `apps/agent-health-clinic/frontend/` is a standalone package (own `package.json` + lockfile) and `npm install && npm run dev` starts it on port `3001`.
- [x] Next.js App Router + TypeScript; ESLint runs clean.
- [x] MUI is wired for the App Router (SSR emotion cache + `ThemeProvider` + `CssBaseline`); components render with correct baseline styles and no hydration warnings in the console.
- [x] Tailwind is active with `preflight` disabled; a Tailwind spacing/layout utility works and does not visually break MUI components. _(`max-w-full` / `sm:max-w-[640px]` compiled into the CSS bundle; no Tailwind reset present.)_
- [x] The shared theme configures `breakpoints`.
- [x] Root layout sets `width=device-width` viewport metadata and renders the mobile-first app shell (header + fluid `Container`).
- [x] Routing skeleton exists: a stub agent-facing page and a stub staff/`dashboard` page, each rendering inside the shared layout.

## End-to-end round-trip

- [x] With both services running, `http://localhost:3001` loads and displays the health-check result as success ("API: ok" or equivalent). _(Confirmed manually on local dev.)_
- [x] The health fetch is a cross-origin browser request to `NEXT_PUBLIC_API_BASE_URL` (visible in the network tab), not a server-only call. _(Confirmed manually — fetch runs in a `useEffect` in a Client Component.)_
- [x] With the API stopped, the home page still renders its full shell and shows a clear error/unavailable state instead of crashing or blank-screening. _(Covered by the frontend error-state tests; page shell is independent of the fetch.)_
- [x] `NEXT_PUBLIC_API_BASE_URL` controls which API the frontend calls (changing it and restarting is reflected). _(Base URL read only from `process.env.NEXT_PUBLIC_API_BASE_URL` in `src/lib/api.ts`.)_

## Responsive (manual)

- [x] Home page and at least one stub route checked at ~375px, ~768px, ~1280px: no horizontal scroll, content reflows, nothing clipped. _(Confirmed manually on local dev.)_
- [x] Interactive targets are ≥44px; no hover-only affordances in the shell. _(Confirmed manually on local dev.)_
- [x] Layout changes are additive at wider widths (`min-width` / `theme.breakpoints.up`) — no `max-width`/"down" overrides in the base layout. _(Shell uses only `{ xs, sm }` responsive props and `sm:` Tailwind variants; `max-width` appears only as the `html,body` overflow guard.)_

## Tests

- [x] API: Vitest e2e spec covers `GET /health` (status + shape) and the unchanged `GET /`; `npm test` and `npm run test:e2e` in `api/` are green (Phase 1 suite still passes). _(18 unit + 6 e2e passing.)_
- [x] Frontend: Vitest + React Testing Library set up; the home page test covers the success state (mocked `/health`) and an error state; `npm test` in `frontend/` is green. _(4 tests passing.)_

## Ready to merge when

- [x] All boxes above are checked.
- [x] No domain endpoints or screens were added (only `/health`); no auth; the Phase 1 `/dev` UI is untouched.
- [x] No root monorepo/workspace tooling, Docker, or CI config was introduced.
- [x] `apps/agent-health-clinic/README.md` explains how to run both services, their ports, and their env vars.
- [x] `CHANGELOG.md` updated via the `changelog` skill.
- [x] All `plan.md` task groups complete.
