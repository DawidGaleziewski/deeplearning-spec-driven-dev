# Requirements — Containerization & one-command run

## Context

This is **Phase 4** of the [roadmap](../roadmap.md). Phases 1–3 delivered:

- **Phase 1** — the core data model in the NestJS API (`Agent`, `Ailment`,
  `Therapy`, `Booking` entities, one migration, a re-runnable seed script, the
  throwaway `/dev` UI).
- **Phase 2** — the two service shells: NestJS API with `GET /health` + CORS,
  Next.js App Router frontend with MUI + Tailwind and a mobile-first base layout.
- **Phase 3** — the first real domain surface: REST CRUD for agents and ailments,
  the agent-facing `/agents` check-in screen, and the shared `@clinic/types`
  package (`file:` dependency, committed `dist/`).

Today the stack runs as **two independent processes in two terminals**
(`api/` on `3000`, `frontend/` on `3001`), each with its own `package.json` and
lockfile, plus a `packages/types/` package both depend on via `file:`. First-run
setup is documented in the app [README](../../README.md): `npm install` in each,
`npm run db:reset` in `api/`, copy `frontend/.env.local.example`, then
`start:dev` / `dev`.

Phase 4 makes the **whole stack build and run in one command** for local
testing, without changing any product behaviour. It is purely packaging and
developer/testing ergonomics.

Per [tech-stack.md](../tech-stack.md): TypeScript end-to-end, Next.js frontend +
separate NestJS API over HTTP, SQLite/TypeORM, Vitest. Nothing in the stack
choices changes here.

## Scope

### In scope

**`api/` Dockerfile — multi-stage**
- A `Dockerfile` at `api/Dockerfile`, multi-stage:
  1. a **build** stage that installs dependencies (including dev deps) and runs
     `nest build` to produce `dist/`;
  2. a **slim runtime** stage that carries only the production `node_modules`,
     the compiled `dist/`, and the files the runtime needs — no build toolchain,
     no dev dependencies, no source `.ts`.
- Base image **`node:24-slim`** (Debian) for every stage — matches the Node 24
  used in local dev and keeps the `better-sqlite3` native build predictable. The
  build/deps stage installs `python3`, `make`, `g++` for `better-sqlite3`'s
  node-gyp compile; the runtime stage has none of them.
- The image must resolve the `@clinic/types` `file:../packages/types`
  dependency. The build context is the **app root** (`apps/agent-health-clinic/`)
  so `packages/types/` (with its committed `dist/`) is copied into the image at
  the same relative location the `file:` specifier expects.
- The runtime container **runs the compiled output** (`node dist/main.js` /
  `start:prod`), **not** `start:dev` / `nest start --watch`.
- `NODE_ENV=production` in the runtime stage. (Consequence: the Phase 1 `/dev`
  UI is not registered in the container — acceptable and intended; it stays
  available in the local two-terminal flow.)
- The container listens on `PORT` (default `3000`) and reads `FRONTEND_ORIGIN`,
  `DATABASE_PATH` from the environment (already supported by `main.ts` /
  `data-source.ts`).
- A container-level entrypoint that, on every start:
  1. runs pending migrations against `DATABASE_PATH`
     (`node dist/database/run-migrations.js`);
  2. seeds **only if the database has no data** (see "DB lifecycle" below);
  3. execs the API process.
- A Docker `HEALTHCHECK` that probes `GET /health` (using Node's built-in
  `fetch` — no extra package, no `curl` in the image).

**`frontend/` Dockerfile — multi-stage**
- A `Dockerfile` at `frontend/Dockerfile`, multi-stage:
  1. a **build** stage that installs dependencies and runs `next build` to
     produce a **production** bundle;
  2. a **slim runtime** stage that serves that production build (`next start -p
     3001`, or the standalone server) — never `next dev`.
- Base image **`node:24-slim`** for every stage.
- `next.config.ts` gains `output: "standalone"` so the runtime image can be the
  minimal traced server (`.next/standalone` + `.next/static` + `public`) instead
  of the full `node_modules`. `transpilePackages: ["@clinic/types"]` stays; the
  standalone trace must include `@clinic/types`.
- The image resolves the `@clinic/types` `file:` dependency the same way the API
  image does (app-root build context, `packages/types/` copied in).
- `NEXT_PUBLIC_API_BASE_URL` is a **build argument** (Next inlines
  `NEXT_PUBLIC_*` values into the client bundle at `next build` time), defaulting
  to `http://localhost:3000` — the URL the **browser on the host** uses to reach
  the published API port. Changing it requires a rebuild; this is called out in
  the README.
- The runtime container listens on port `3001` and runs as a non-root user.

**Root `docker-compose.yml`** (at `apps/agent-health-clinic/docker-compose.yml`)
- Two services, `api` and `frontend`, each `build:` from its Dockerfile with
  `context: .` (the app root) and the appropriate `dockerfile:`.
- Published ports: `api` → `3000:3000`, `frontend` → `3001:3001`.
- Cross-service env vars wired so the browser and CORS line up:
  - `api`: `FRONTEND_ORIGIN=http://localhost:3001`,
    `DATABASE_PATH=/data/clinic.sqlite`, `NODE_ENV=production`.
  - `frontend` build arg: `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000`.
- A **named volume** mounted into the `api` container at `/data` holds the SQLite
  file, so data persists across `up` / `down` cycles.
- `frontend` `depends_on` `api` with `condition: service_healthy`; the `api`
  service defines the compose-level healthcheck (may reuse the Dockerfile
  `HEALTHCHECK`).
- Values that a user might reasonably change (host ports, origins, the API base
  URL) are read from a compose `.env` file (see below) with sensible defaults.

**Compose `.env` file**
- A committed **`.env.example`** at the app root listing the compose-consumed
  variables: `API_PORT`, `FRONTEND_PORT`, `FRONTEND_ORIGIN`,
  `NEXT_PUBLIC_API_BASE_URL`.
- `docker compose` auto-reads `.env`; the README tells the user to
  `cp .env.example .env` (optional — defaults work with no `.env`).
- A new app-root `.gitignore` (or an added rule) ignores `.env` while keeping
  `.env.example` tracked.

**DB lifecycle (migrate-always, seed-if-empty)**
- The API entrypoint runs migrations on every container start (idempotent —
  `runMigrations()` no-ops when there is nothing pending).
- It seeds **only when the database is empty**. "Empty" = the core tables have no
  rows (e.g. `SELECT COUNT(*) FROM agent` is `0`, or the schema was just
  created). Implementation: refactor `src/seed/seed.ts` so its logic is an
  exported function, and add a guarded entry (a `--if-empty` flag on the seed
  script, or a small `seed-if-empty.ts`) that the entrypoint calls. The existing
  `npm run seed` / `npm run db:reset` behaviour (always wipe + reseed) is
  unchanged for local use.
- Result: `docker compose up --build` on a fresh volume comes up **seeded** with
  demo data; agents/ailments created through the UI **survive** a
  `docker compose down` + `up`; `docker compose down -v` returns to a clean,
  re-seedable state.

**Makefile / script wrappers**
- A `Makefile` at the app root with thin aliases over the compose commands, at
  minimum: `up` (`docker compose up --build`), `down` (`docker compose down`),
  `clean` / `down-hard` (`docker compose down -v`), `logs`, and `seed` /
  `reset` (run the seed / db:reset inside the running `api` container via
  `docker compose exec`). No logic beyond wrapping compose.

**`.dockerignore`**
- A `.dockerignore` at the app root (the build context) excluding
  `**/node_modules`, `**/.next`, `api/dist`, `**/coverage`, `**/*.sqlite*`,
  `**/*.tsbuildinfo`, `.git`, `specs`, test output, and the local `.env` — while
  **keeping** `packages/types/dist` (committed, required by the `file:` install)
  and each `package-lock.json`.

**GitHub Actions — build check**
- A workflow at the **repo root** `.github/workflows/` (GitHub requires that
  location) that, on pull requests touching `apps/agent-health-clinic/**`, runs
  `docker compose build` (both images) and a minimal smoke test: `docker compose
  up -d`, wait for the `api` healthcheck to go healthy, `curl`
  `http://localhost:3001` and `http://localhost:3000/health` for `200`, then
  `docker compose down -v`. Uses Docker Buildx with layer caching
  (`type=gha`).

**Documentation**
- The app [README](../../README.md) gets a **"Run with Docker"** section
  presented **alongside** the existing two-terminal flow (not replacing it):
  the one-command `docker compose up --build` from the app root, the URLs, the
  `.env` copy step, the `NEXT_PUBLIC_API_BASE_URL`-needs-a-rebuild note, the
  Makefile targets, and a documented teardown (`docker compose down`, and
  `down -v` for a clean slate).
- `api/README.md` notes the container entrypoint's migrate-always / seed-if-empty
  behaviour and that `/dev` is off under `NODE_ENV=production`.
- `CHANGELOG.md` updated via the `changelog` skill.

### Out of scope (later phases / not now)

- **Any product feature change.** No new endpoints, no UI changes, no schema or
  seed-data changes beyond refactoring `seed.ts` into a reusable function.
- **Production / cloud deployment** — hosting, a container registry, image
  publishing, TLS, reverse proxy, domain, non-local `NEXT_PUBLIC_API_BASE_URL`.
  This phase is local build + run only.
- **Switching the database** away from file-based SQLite (no Postgres container,
  no DB service).
- **A dev-mode compose file** with hot reload / bind-mounted source /
  `start:dev`. The container flow runs the production build; live editing stays
  in the two-terminal flow. (`docker-compose.override.yml` for dev is a possible
  future add, explicitly deferred.)
- **Root monorepo / workspace tooling** (npm/pnpm workspaces, Turborepo, Nx).
  `@clinic/types` stays a plain `file:` dependency.
- **Multi-arch image builds** (`linux/arm64` + `amd64` manifests). Images build
  for the host / CI architecture only.
- **Image size micro-optimisation** beyond "multi-stage, slim base, prod deps
  only, standalone frontend" — no distroless, no manual `node_modules` pruning.
- **Removing the Phase 1 `/dev` UI** or the two-terminal instructions.
- **Container orchestration** beyond Compose (no Kubernetes manifests, no Helm).
- **Publishing the CI-built images** anywhere — the workflow builds and smoke
  tests, it does not push.

## Decisions

- **Compose file + build context at the app root
  (`apps/agent-health-clinic/`), not the monorepo root.** The roadmap's "repo
  root" means the app; `apps/agent-health-clinic/` is self-contained (its own
  README, CHANGELOG, specs) and is the only app. The build context must be the
  app root regardless, because `@clinic/types` is referenced as
  `file:../packages/types` from both `api/` and `frontend/` — the context has to
  contain `packages/types/`.
- **`node:24-slim` (Debian) for all stages.** Matches local dev's Node 24, so
  behaviour is consistent, and Debian keeps `better-sqlite3`'s node-gyp build
  straightforward (`python3` + `make` + `g++` in the build stage only). Alpine
  would shave image size but adds musl-compile friction on a native module for
  no real benefit at this scale.
- **Migrate always, seed only if empty.** Migrations are idempotent, so running
  them every boot is safe and keeps a persisted volume current. Seeding only on
  an empty DB means the first `up` gives a working demo stack **and** data
  entered through the UI is not wiped on the next restart — which is what the
  roadmap's "seeds/persists" wording implies. `docker compose down -v` is the
  explicit "give me clean demo data again" gesture.
- **`NEXT_PUBLIC_API_BASE_URL` as a build arg, defaulting to
  `http://localhost:3000`.** Next inlines `NEXT_PUBLIC_*` at build time, so it
  cannot be a pure runtime env var. The browser making the call runs on the
  host, where the API is published on `3000` — so `localhost:3000` is correct
  for the containerized stack, same as the local flow. Documented that changing
  it means `--build`.
- **`FRONTEND_ORIGIN=http://localhost:3001` as a runtime env var.** CORS is
  enforced by the API process against the browser's `Origin` header, which is
  `http://localhost:3001` (the host-published frontend port) — no container
  networking involved for the browser round-trip.
- **Frontend `output: "standalone"`.** The one small `next.config.ts` change
  that makes a genuinely slim runtime image possible; it is packaging config,
  not a behaviour change.
- **Named volume for the SQLite file, mounted at `/data`.** A named volume
  (not a bind mount) keeps persistence portable across OSes and gives
  `down -v` a clean semantic. `DATABASE_PATH=/data/clinic.sqlite` keeps the
  container DB path distinct from the local `data/dev.sqlite`.
- **All four robustness extras are in.** Healthcheck + `depends_on` wait
  (deterministic startup), Makefile (discoverable commands), `.env` file
  (one editable source for ports/origins), and a CI build+smoke workflow
  (containerization stays working as later phases land). None of them touch
  product code.
- **Production build in the container; no dev-mode compose.** The roadmap is
  explicit — the API image "runs the compiled NestJS output, not `start:dev`"
  and the frontend "builds a production Next.js bundle". Live-reload development
  stays in the documented two-terminal flow.
- **`/dev` UI off in the container.** It is registered only when
  `NODE_ENV !== 'production'` (or `ENABLE_DEV_UI=true`); the container sets
  `NODE_ENV=production` and does not set the override. The throwaway Phase 1
  surface has no place in the packaged stack.

## Open questions

- **Frontend healthcheck.** The `api` healthcheck is required (it gates
  `depends_on`). Whether `frontend` also gets its own `HEALTHCHECK` /
  compose healthcheck is the implementer's call — nice for `compose ps` clarity,
  not required by anything.
- **`npm ci` strategy for the API runtime deps.** Either a dedicated deps stage
  running `npm ci --omit=dev` (with the build toolchain) whose `node_modules` is
  copied to runtime, or copy the build stage's `node_modules` and prune. The
  constraint is: runtime image has no compiler and no dev dependencies, and
  `better-sqlite3` loads. Implementer picks.
- **Seed-if-empty mechanism** — a `--if-empty` flag on the existing seed script
  vs. a separate `seed-if-empty.ts` entry. Either is fine as long as
  `src/seed/seed.ts`'s logic becomes an importable function and the
  always-reseed `npm run seed` / `db:reset` scripts keep working.
- **CI runner Docker cache** — `type=gha` is the default assumption; a registry
  cache is out of scope while nothing is pushed.
