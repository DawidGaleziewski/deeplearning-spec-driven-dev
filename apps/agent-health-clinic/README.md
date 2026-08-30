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
Run them in two terminals (below) or as one containerized stack (see
[Run with Docker](#run-with-docker)).

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

## Run with Docker

An alternative to the two-terminal flow above: build and run the whole stack
with one command. Both services ship as slim multi-stage images (production
build, not `start:dev` / `next dev`) wired together by Compose.

**Requires** Docker Engine with the Compose plugin (`docker compose version`).
On WSL, run from a shell where `docker ps` works without `sudo`.

```bash
# from this directory (apps/agent-health-clinic/)
docker compose up --build        # or: make up

# or detached, then follow logs:
docker compose up --build -d
docker compose logs -f
```

The first build takes a few minutes (both images install dependencies and run a
production build); later builds are cached. When it's up, open
<http://localhost:3001> — same app as local dev, showing **API: ok**. On a fresh
volume the database comes up migrated and seeded with demo data.

```bash
docker compose down              # stop; SQLite data persists on a named volume
docker compose up                # restart — data (incl. agents you created) is still there
docker compose down -v           # stop AND wipe the volume; next `up` re-seeds
```

The API container's entrypoint runs pending migrations on every start, then
seeds **only if the database is empty** — so data entered through the UI
survives a restart, and `down -v` is the "give me clean demo data again"
gesture. `/dev` is **not** available in the container (`NODE_ENV=production`).

### Configuration

`docker compose` reads an optional `.env` in this directory. It has exactly two
knobs — copy the template if you need to change a port:

```bash
cp .env.example .env             # optional; defaults (3000 / 3001) work with no .env
```

| Variable        | Default | Purpose                                    |
| --------------- | ------- | ------------------------------------------ |
| `API_PORT`      | `3000`  | Host port the API is published on.         |
| `FRONTEND_PORT` | `3001`  | Host port the frontend is published on.    |

`FRONTEND_ORIGIN` (API CORS) and `NEXT_PUBLIC_API_BASE_URL` (baked into the
frontend bundle) are **derived** from these two ports in `docker-compose.yml` —
do not set them yourself. Because `NEXT_PUBLIC_API_BASE_URL` is inlined at build
time, **changing `API_PORT` requires `docker compose up --build`**.

> This `.env` is only for the Docker stack. It is **not**
> `frontend/.env.local.example`, which feeds the two-terminal flow above.

### Makefile shortcuts

Thin aliases over the `docker compose …` commands above — run from this
directory. Needs `make` (`sudo apt install make`); everything works without it.

| Target       | Runs                                                     | Notes |
| ------------ | ------------------------------------------------------- | ----- |
| `make up`    | `docker compose up --build`                             | foreground; Ctrl-C to stop |
| `make up-d`  | `docker compose up --build -d`                          | detached |
| `make down`  | `docker compose down`                                   | stop; **keeps** the data volume |
| `make clean` | `docker compose down -v`                                | stop **and** drop the data volume |
| `make logs`  | `docker compose logs -f`                                | follow both services |
| `make build` | `docker compose build`                                  | build images, don't start |
| `make seed`  | `docker compose exec api node dist/seed/seed.js`        | force wipe + reseed; **stack must be running** |
| `make reset` | drop `clinic.sqlite*`, re-migrate, reseed in the `api` container | **stack must be running** |

Typical loop:

```bash
make up-d        # start in the background
make logs        # watch it come up
make down        # stop for the day (data kept)
make clean       # ...or wipe and start fresh next time
```

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
