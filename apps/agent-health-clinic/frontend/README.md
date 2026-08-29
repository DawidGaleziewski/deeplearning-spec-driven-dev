# AgentClinic — frontend

Next.js (App Router) + TypeScript + MUI + Tailwind. Standalone package; the
NestJS API lives in `../api/` and runs as a separate process.

```bash
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_BASE_URL
npm run dev                         # http://localhost:3001
npm test                            # Vitest + React Testing Library
npm run build
```

## Layout

- `src/app/` — App Router routes. `/` (home, health round-trip), `/agents` and
  `/dashboard` (Phase 2 routing-skeleton stubs).
- `src/components/ThemeRegistry.tsx` — MUI App Router SSR wiring (emotion cache +
  `ThemeProvider` + `CssBaseline`), used from the root layout.
- `src/components/AppShell.tsx` — mobile-first base layout (header + fluid
  `Container`) every screen inherits.
- `src/theme.ts` — shared MUI theme with `breakpoints` configured.
- `src/lib/api.ts` — API base URL + `fetchHealth()`.

Tailwind's `preflight` is disabled (`tailwind.config.ts`) so it does not fight
MUI's `CssBaseline` — Tailwind is for spacing/layout utilities only.

## Env

| Variable                   | Default                 | Purpose                                       |
| -------------------------- | ----------------------- | -------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:3000` | API base URL the browser calls for `/health`. |
