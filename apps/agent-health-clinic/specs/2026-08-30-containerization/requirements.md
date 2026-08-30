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
- The **build** stage must resolve the `@clinic/types` `file:../packages/types`
  dependency so `nest build`'s typecheck sees its `.d.ts`. The build context is
  the **app root** (`apps/agent-health-clinic/`) so `packages/types/` (with its
  committed `dist/`) is copied into the image at the same relative location the
  `file:` specifier expects, **before** `npm ci`. `@clinic/types` is types-only
  (no runtime code — every import of it is `import type`), so it is erased from
  `dist/` at compile time and the **runtime** stage does not need it resolvable
  at all; whether it is carried into the runtime `node_modules` is immaterial.
- The runtime container **runs the compiled output** (`node dist/main.js` /
  `start:prod`), **not** `start:dev` / `nest start --watch`.
- `NODE_ENV=production` in the runtime stage. (Consequence: the Phase 1 `/dev`
  UI is not registered in the container — acceptable and intended; it stays
  available in the local two-terminal flow.)
- The container listens on `PORT` (default `3000`) and reads `FRONTEND_ORIGIN`,
  `DATABASE_PATH` from the environment (already supported by `main.ts` /
  `data-source.ts`). The running app's `DatabaseModule` has no `migrationsRun`,
  so schema readiness depends entirely on the entrypoint running migrations
  before the API process starts — keep that ordering.
- The runtime stage runs as a **non-root** user. Because the SQLite file lives on
  a named volume mounted at `/data`, the Dockerfile must create `/data` and
  `chown` it to the runtime user **before** the volume is first mounted, so the
  fresh volume inherits non-root ownership and the entrypoint can create
  `clinic.sqlite` (and its `-wal` / `-shm` companions).
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
- `next.config.ts` gains:
  - `output: "standalone"` so the runtime image can be the minimal traced server
    (`.next/standalone` + `.next/static` + `public`) instead of the full
    `node_modules`;
  - `outputFileTracingRoot` set to the app root (`path.join(__dirname, "..")`),
    because `@clinic/types` lives in a sibling `packages/` directory — without it
    Next infers a narrower trace root and the standalone layout / any traced file
    outside `frontend/` lands in the wrong place. (Verify against the actual
    Next 16 build output — see `frontend/AGENTS.md`.)
  - `transpilePackages: ["@clinic/types"]` stays.
- The **build** stage resolves the `@clinic/types` `file:` dependency the same
  way the API image does (app-root build context, `packages/types/` copied in
  before `npm ci`) so `next build`'s typecheck sees its `.d.ts`. `@clinic/types`
  is types-only, so it is erased at build time and nothing referencing it reaches
  the runtime bundle — there is no runtime module to resolve.
- `NEXT_PUBLIC_API_BASE_URL` is a **build argument** (Next inlines
  `NEXT_PUBLIC_*` values into the client bundle at `next build` time), defaulting
  to `http://localhost:3000` — the URL the **browser on the host** uses to reach
  the published API port. It is **derived from `API_PORT`** by compose (see the
  `.env` section), not set independently. Changing the API port therefore
  requires a frontend rebuild (`--build`); this is called out in the README.
- The runtime container listens on port `3001` and runs as a non-root user.
- The Next standalone server reads `HOSTNAME` and `PORT` from the environment
  (not a `-p` flag). The runtime stage must set `ENV HOSTNAME=0.0.0.0` and
  `ENV PORT=3001` so the server binds all interfaces inside the container —
  recent Next defaults `HOSTNAME` to `localhost`, which is unreachable from
  outside the container.

**Root `docker-compose.yml`** (at `apps/agent-health-clinic/docker-compose.yml`)
- Two services, `api` and `frontend`, each `build:` from its Dockerfile with
  `context: .` (the app root) and the appropriate `dockerfile:`.
- Published ports: `api` → `${API_PORT:-3000}:3000`, `frontend` →
  `${FRONTEND_PORT:-3001}:3001`. The container-internal ports stay `3000` /
  `3001`.
- Cross-service env vars **derived from the two port knobs** so the browser and
  CORS always line up — no independent origin/URL variables to keep in sync:
  - `api`: `FRONTEND_ORIGIN=http://localhost:${FRONTEND_PORT:-3001}`,
    `DATABASE_PATH=/data/clinic.sqlite`, `NODE_ENV=production`.
  - `frontend` build arg:
    `NEXT_PUBLIC_API_BASE_URL=http://localhost:${API_PORT:-3000}`.
- A **named volume** mounted into the `api` container at `/data` holds the SQLite
  file, so data persists across `up` / `down` cycles.
- `frontend` `depends_on` `api` with `condition: service_healthy`; the `api`
  service defines the compose-level healthcheck (may reuse the Dockerfile
  `HEALTHCHECK`) **with a `start_period`** (≈30s) so the first-boot
  migrate + seed does not count as failing probes.

**Compose `.env` file**
- A committed **`.env.example`** at the app root listing exactly the two
  compose-consumed variables: `API_PORT` (default `3000`) and `FRONTEND_PORT`
  (default `3001`). `FRONTEND_ORIGIN` and `NEXT_PUBLIC_API_BASE_URL` are
  **computed** from these in `docker-compose.yml`, not user-set, so a port change
  cannot desync CORS or the browser's API URL.
- `docker compose` auto-reads `.env`; the README tells the user to
  `cp .env.example .env` (optional — defaults work with no `.env`), and that
  changing `API_PORT` needs `docker compose up --build` (the value is baked into
  the frontend bundle).
- This compose `.env` is **separate from** `frontend/.env.local.example`, which
  only feeds the two-terminal local flow; the README must not conflate them.
- A new app-root `.gitignore` (or an added rule) ignores `.env` and any local
  `docker-compose.override.yml` while keeping `.env.example` tracked.

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
  `docker compose exec`). No logic beyond wrapping compose. The `reset` target's
  file removal must cover `clinic.sqlite*` (the `-wal` / `-shm` files too), not
  just `clinic.sqlite`.

**`.dockerignore`**
- A `.dockerignore` at the app root (the build context) excluding
  `**/node_modules`, `**/.next`, `api/dist`, `**/coverage`, `**/*.sqlite*`,
  `**/*.tsbuildinfo`, `.git`, `specs`, test output, and the local `.env` — while
  **keeping** `packages/types/dist` (committed; the build stages typecheck
  against its `.d.ts`) and each `package-lock.json`.

**GitHub Actions — build & cross-service smoke check**
- A workflow at the **repo root** `.github/workflows/` (GitHub requires that
  location) that, on pull requests touching `apps/agent-health-clinic/**`, runs
  `docker compose build` (both images) then `docker compose up -d` and:
  1. waits for the `api` healthcheck to go healthy;
  2. `curl`s `http://localhost:3001` and `http://localhost:3000/health` for
     `200` (liveness);
  3. a **browser-shaped check** of the actual cross-service wiring — the point
     of this phase. Either: a `fetch` to `http://localhost:3000/agents` (and
     `/health`) sent with an explicit `Origin: http://localhost:3001` header,
     asserting the response carries a matching
     `Access-Control-Allow-Origin`; **or** a headless Playwright run that loads
     `http://localhost:3001`, asserts the health widget shows "API: ok", opens
     `/agents`, and confirms the seeded agents render (proving
     `NEXT_PUBLIC_API_BASE_URL` was baked correctly and CORS allows the call).
     Implementer picks; the header-`fetch` option is lighter and sufficient.
  4. always `docker compose down -v`; on failure dump `docker compose logs`.
- Uses Docker Buildx with layer caching (`type=gha`).

**Documentation**
- The app [README](../../README.md) gets a **"Run with Docker"** section
  presented **alongside** the existing two-terminal flow (not replacing it):
  the one-command `docker compose up --build` from the app root, the URLs, the
  `.env` copy step (two port knobs; not the same file as
  `frontend/.env.local.example`), the "changing `API_PORT` needs `--build`"
  note, the Makefile targets, and a documented teardown (`docker compose down`,
  and `down -v` for a clean slate).
- `api/README.md` notes the container entrypoint's migrate-always / seed-if-empty
  behaviour, that `DatabaseModule` does not self-run migrations (the entrypoint
  must), the new `db:seed:if-empty` script, and that `/dev` is off under
  `NODE_ENV=production`.
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
- **`NEXT_PUBLIC_API_BASE_URL` as a build arg, derived from `API_PORT`.** Next
  inlines `NEXT_PUBLIC_*` at build time, so it cannot be a pure runtime env var.
  The browser making the call runs on the host, where the API is published on
  `API_PORT` (default `3000`) — so `http://localhost:${API_PORT}` is correct for
  the containerized stack. Compose computes it; the user never sets it directly.
  Documented that changing `API_PORT` means `--build`.
- **All API fetching is client-side.** Verified: every `@clinic/types` import is
  `import type`, and `frontend/src/lib/api.ts` is only ever called from `"use
  client"` components (`HealthCheck`, `AgentsScreen` and children) — no RSC / SSR
  fetch. So the single host-origin API URL is correct everywhere; there is no
  second server-side base URL (`http://api:3000`) to configure.
- **`FRONTEND_ORIGIN` as a runtime env var, derived from `FRONTEND_PORT`.** CORS
  is enforced by the API process against the browser's `Origin` header, which is
  `http://localhost:${FRONTEND_PORT}` (the host-published frontend port) — no
  container networking involved for the browser round-trip. Deriving it from the
  same port knob means a port change can't desync CORS.
- **Two port knobs only (`API_PORT`, `FRONTEND_PORT`); origins derived.** Rather
  than four independent `.env` variables that must be hand-kept in sync (and one
  needing a rebuild), the user changes at most a port and compose computes
  `FRONTEND_ORIGIN` and `NEXT_PUBLIC_API_BASE_URL` from it. One source of truth,
  no mismatch class of bug.
- **Frontend `output: "standalone"`.** The one small `next.config.ts` change
  that makes a genuinely slim runtime image possible; it is packaging config,
  not a behaviour change.
- **Named volume for the SQLite file, mounted at `/data`.** A named volume
  (not a bind mount) keeps persistence portable across OSes and gives
  `down -v` a clean semantic. `DATABASE_PATH=/data/clinic.sqlite` keeps the
  container DB path distinct from the local `data/dev.sqlite`.
- **All four robustness extras are in.** Healthcheck (with `start_period`) +
  `depends_on` wait (deterministic startup), Makefile (discoverable commands),
  `.env` file (the two port knobs), and a CI build + cross-service smoke workflow
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
  `better-sqlite3` loads. Implementer picks. Note `node:24` may have no
  `better-sqlite3` prebuild for its ABI yet, so a source compile in whichever
  stage runs `npm ci` is expected — hence the toolchain there.
- **`@clinic/types` during `npm ci` in Docker.** Local `npm install` resolves
  the `file:` dep by symlink and does **not** run its `prepare` (`tsc`), relying
  on the committed `dist/`. If a Docker `npm ci` ever does try to run `prepare`,
  it fails (no `typescript` in `packages/types` — `node_modules` is gitignored,
  *not* vendored, contrary to an earlier draft note). Mitigations if it bites:
  `npm ci --ignore-scripts` for that install, or copy a prebuilt
  `packages/types/node_modules`, or add `typescript` to the build stage. Confirm
  actual behaviour during 2.2 / 3.2.
- **Seed-if-empty mechanism** — a `--if-empty` flag on the existing seed script
  vs. a separate `seed-if-empty.ts` entry. Either is fine as long as
  `src/seed/seed.ts`'s logic becomes an importable function and the
  always-reseed `npm run seed` / `db:reset` scripts keep working.
- **CI runner Docker cache** — `type=gha` is the default assumption; a registry
  cache is out of scope while nothing is pushed.
- **Next 16 standalone layout** — the exact emitted path for `server.js` (bare
  vs. `frontend/` prefixed) and whether `outputFileTracingRoot` alone gives a
  clean copy layout must be read off the real `next build` output during 1.1 /
  3.3; the Dockerfile `COPY` lines follow from that. Not a design decision, just
  a verify-against-reality step (see `frontend/AGENTS.md`).
- **CI cross-service check mechanism** — `curl` with an explicit `Origin` header
  (light) vs. headless Playwright (fuller). Decided: header-`curl` is sufficient;
  Playwright only if a browser dependency is already justified.
