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

More detail on the API module tree in [`api/README.md`](api/README.md).
