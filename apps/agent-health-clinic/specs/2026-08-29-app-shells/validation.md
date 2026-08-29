# Validation — App Shells

This phase is done when every box below is checked. It validates that both service shells exist, run independently, and round-trip a health check end to end, with a mobile-first base layout — no domain features.

## NestJS API shell

- [ ] `GET /health` returns 200 with JSON of the agreed shape (`{ status: "ok", ... }`) and does not query the database.
- [ ] `GET /` still returns the Phase 1 hello string (unchanged).
- [ ] The app boots with all feature modules registered including `HealthModule` — no DI/wiring errors.
- [ ] CORS is enabled for the frontend origin from an env var (`FRONTEND_ORIGIN`); a browser request from the frontend port succeeds and a disallowed origin is rejected.
- [ ] Listen port is configurable via `PORT` (default `3000`).
- [ ] `api/README.md` documents the module tree and the env vars the service reads.

## Next.js frontend shell

- [ ] `apps/agent-health-clinic/frontend/` is a standalone package (own `package.json` + lockfile) and `npm install && npm run dev` starts it on port `3001`.
- [ ] Next.js App Router + TypeScript; ESLint runs clean.
- [ ] MUI is wired for the App Router (SSR emotion cache + `ThemeProvider` + `CssBaseline`); components render with correct baseline styles and no hydration warnings in the console.
- [ ] Tailwind is active with `preflight` disabled; a Tailwind spacing/layout utility works and does not visually break MUI components.
- [ ] The shared theme configures `breakpoints`.
- [ ] Root layout sets `width=device-width` viewport metadata and renders the mobile-first app shell (header + fluid `Container`).
- [ ] Routing skeleton exists: a stub agent-facing page and a stub staff/`dashboard` page, each rendering inside the shared layout.

## End-to-end round-trip

- [ ] With both services running, `http://localhost:3001` loads and displays the health-check result as success ("API: ok" or equivalent).
- [ ] The health fetch is a cross-origin browser request to `NEXT_PUBLIC_API_BASE_URL` (visible in the network tab), not a server-only call.
- [ ] With the API stopped, the home page still renders its full shell and shows a clear error/unavailable state instead of crashing or blank-screening.
- [ ] `NEXT_PUBLIC_API_BASE_URL` controls which API the frontend calls (changing it and restarting is reflected).

## Responsive (manual)

- [ ] Home page and at least one stub route checked at ~375px, ~768px, ~1280px: no horizontal scroll, content reflows, nothing clipped.
- [ ] Interactive targets are ≥44px; no hover-only affordances in the shell.
- [ ] Layout changes are additive at wider widths (`min-width` / `theme.breakpoints.up`) — no `max-width`/"down" overrides in the base layout.

## Tests

- [ ] API: Vitest e2e spec covers `GET /health` (status + shape) and the unchanged `GET /`; `npm test` and `npm run test:e2e` in `api/` are green (Phase 1 suite still passes).
- [ ] Frontend: Vitest + React Testing Library set up; the home page test covers the success state (mocked `/health`) and an error state; `npm test` in `frontend/` is green.

## Ready to merge when

- [ ] All boxes above are checked.
- [ ] No domain endpoints or screens were added (only `/health`); no auth; the Phase 1 `/dev` UI is untouched.
- [ ] No root monorepo/workspace tooling, Docker, or CI config was introduced.
- [ ] `apps/agent-health-clinic/README.md` explains how to run both services, their ports, and their env vars.
- [ ] `CHANGELOG.md` updated via the `changelog` skill.
- [ ] All `plan.md` task groups complete.
