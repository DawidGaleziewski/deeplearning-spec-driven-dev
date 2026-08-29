# AgentClinic

A health clinic — but the patients are AI agents, and the ailment is *their humans*.
See [`specs/mission.md`](specs/mission.md) for the premise and
[`specs/roadmap.md`](specs/roadmap.md) for the phase plan.

## Input from stakeholders

- Mary in engineering wants a reliable site with a popular stack based on TypeScript, giving agents and staff a dashboard for easy access.
- Susan in product has a set of features about agents and their ailments, therapies, and booking appointments.
- Steve in marketing wants an attractive site that works well with a modern browser.

## Architecture

Two **standalone** services, started independently (two terminals), talking over HTTP:

| Service     | Path         | Stack                                   | Dev port |
| ----------- | ------------ | --------------------------------------- | -------- |
| API         | `api/`       | NestJS, TypeORM, SQLite, Vitest         | `3000`   |
| Frontend    | `frontend/`  | Next.js (App Router), MUI + Tailwind    | `3001`   |

Each has its own `package.json` and lockfile — there is no root workspace tooling yet.

### `packages/types` — shared HTTP contract

`@clinic/types` (`packages/types/`) holds the request/response shapes both
services share — types only, no runtime code. Each service depends on it with a
`file:` specifier, so `npm install` in `api/` or `frontend/` symlinks it in.
The compiled output in `packages/types/dist/` is **committed**, so a fresh
install needs no extra step. After editing `packages/types/src/`, rebuild it:

```bash
cd packages/types && npm run build
```

The frontend also lists it in `transpilePackages` (`next.config.ts`). See
[`packages/types/README.md`](packages/types/README.md).

## Running locally

```bash
# terminal 1 — API
cd api
npm install
npm run db:reset      # first run: create + seed data/dev.sqlite
npm run start:dev     # http://localhost:3000  (GET /health, GET /)

# terminal 2 — frontend
cd frontend
npm install
cp .env.local.example .env.local
npm run dev           # http://localhost:3001
```

Open <http://localhost:3001> — the home page round-trips `GET /health` from the
browser and shows **API: ok**. Stop the API and reload: the page still renders
with an "API unavailable" notice.

**`/agents`** is the agent-facing check-in screen (Phase 3): check in an agent,
open its chart at `/agents/[id]`, and log/edit/remove complaints. All data is
fetched browser-side from `NEXT_PUBLIC_API_BASE_URL`; the screen still renders
(with an error notice) when the API is down.

## Environment variables

### `api/`

| Variable          | Default                 | Purpose                                  |
| ----------------- | ----------------------- | --------------------------------------- |
| `PORT`            | `3000`                  | HTTP listen port.                      |
| `FRONTEND_ORIGIN` | `http://localhost:3001` | Allowed CORS origin for browser calls. |
| `DATABASE_PATH`   | `data/dev.sqlite`       | SQLite file (`:memory:` in tests).     |
| `DB_SYNCHRONIZE`  | `false`                 | TypeORM auto-schema (migrations are the real path). |
| `ENABLE_DEV_UI`   | unset                   | Force-register the throwaway `/dev` UI. |

### `frontend/`

| Variable                   | Default                 | Purpose                                    |
| -------------------------- | ----------------------- | ----------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:3000` | API base URL the browser calls for `/health`. |

## Tests

```bash
cd api && npm test && npm run test:e2e
cd frontend && npm test
```

More detail on the API module tree and the agents/ailments endpoints in
[`api/README.md`](api/README.md).
