# Plan — App Shells

Task groups roughly in dependency order. Groups 1–2 (API) and 3–5 (frontend) can proceed in parallel once group 1 lands the `/health` contract.

## 1. NestJS API — health endpoint & CORS

1.1. Add a `health` module: `HealthModule` + `HealthController` with `GET /health` returning JSON `{ status: 'ok' }` (optionally `uptime` / `timestamp`). No repository/DB access.
1.2. Register `HealthModule` in `AppModule`. Leave the existing `AppController` `GET /` hello string untouched.
1.3. In `main.ts`, call `app.enableCors({ origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3001' })`.
1.4. Confirm `PORT` (default `3000`) is honoured by `app.listen(...)`; add it if missing.
1.5. Document the module tree and intended boundaries in `api/README.md` (feature modules: `agents`, `ailments`, `therapies`, `bookings`, `database`, `health`, `dev` when enabled).

## 2. NestJS API — tests

2.1. Add e2e coverage (extend `test/app.e2e-spec.ts` or new `test/health.e2e-spec.ts` under `vitest.config.e2e.ts`):
     - `GET /health` → 200 and body matches the expected shape.
     - `GET /` → still returns the Phase 1 hello string.
2.2. Run `npm test` and `npm run test:e2e` in `api/`; confirm the full suite (Phase 1 + new) is green.

## 3. Next.js frontend — scaffold

3.1. Create `apps/agent-health-clinic/frontend/` via `create-next-app` (TypeScript, App Router, ESLint, `src/` dir, no Turbopack requirement). Own `package.json` + lockfile.
3.2. Set the dev port to `3001` (`next dev -p 3001`) in the `dev`/`start:dev` script.
3.3. Add `.env.local.example` (committed) documenting `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000`.
3.4. Strip the boilerplate home page / marketing CSS down to a blank starting point.

## 4. Next.js frontend — MUI + Tailwind baseline

4.1. Install MUI (`@mui/material`, `@emotion/*`, `@mui/material-nextjs`) and set up the App Router SSR integration: emotion cache provider + `ThemeProvider` + `CssBaseline` in the root layout.
4.2. Define a shared `theme.ts` with `breakpoints` configured (default values are fine) and a `ThemeRegistry` client component wrapping `children`.
4.3. Install Tailwind; in `tailwind.config`, set `corePlugins: { preflight: false }`; add the Tailwind directives to the global stylesheet **after** nothing that would re-introduce a reset. Confirm MUI components still render with correct baseline styles.
4.4. Add `viewport` metadata (`width=device-width, initialScale=1`) in the root layout.

## 5. Next.js frontend — layout, routing skeleton, home round-trip

5.1. Build the mobile-first base layout in `app/layout.tsx`: an app header (clinic name), a fluid MUI `Container` main region, footer optional. Works from ~375px with no horizontal scroll; layout enhancements use `min-width` / `theme.breakpoints.up(...)` only.
5.2. Add routing skeleton: stub pages for an agent-facing area and a staff area (e.g. `app/dashboard/page.tsx`), each a "coming soon" placeholder rendered inside the shared layout.
5.3. Build the home page (`app/page.tsx` + a client child): on mount, `fetch(\`${NEXT_PUBLIC_API_BASE_URL}/health\`)`; render a pending state, then "API: ok" on success or a clear error state on failure. Page shell renders regardless of API availability.
5.4. Basic in-universe copy on the home page (one or two lines) — plain text, no design pass.

## 6. Frontend tests

6.1. Set up Vitest in `frontend/` (`vitest.config.ts`, jsdom environment, React Testing Library, `@testing-library/jest-dom`).
6.2. Home page test: mock `fetch`, render, assert the shell renders and that the success state appears after the mocked `/health` resolves; add an error-state case with a rejected/500 mock.
6.3. Add a `test` script; run it and confirm green.

## 7. Integration & docs wrap-up

7.1. Start `api/` (`npm run start:dev`, port 3000) and `frontend/` (`npm run dev`, port 3001) together; load `http://localhost:3001` and confirm the home page shows "API: ok".
7.2. Stop the API and reload; confirm the home page still renders with a graceful error state.
7.3. Manually check the home page and one stub route at ~375px, ~768px, ~1280px — no horizontal scroll, layout reflows, touch targets ≥44px.
7.4. Update `apps/agent-health-clinic/README.md`: install/run steps for both services, ports, env vars (`PORT`, `FRONTEND_ORIGIN`, `NEXT_PUBLIC_API_BASE_URL`).
7.5. Update `apps/agent-health-clinic/CHANGELOG.md` via the `changelog` skill.
7.6. Tick off `validation.md` as items are confirmed, then open for review/merge.
