# Validation — Containerization & one-command run

This phase is done when every box below is checked. It validates that both
services build as slim multi-stage images and run together with one command,
with the SQLite data seeded on first run and persisted afterwards — and with
**no product behaviour changed** from Phase 3.

Verify from a clean checkout of the branch, with Docker running, `cwd` =
`apps/agent-health-clinic/`.

## App changes (no behaviour change)

- [ ] `frontend/next.config.ts` sets `output: "standalone"`,
      `outputFileTracingRoot` at the app root, and keeps
      `transpilePackages: ["@clinic/types"]`; `npm run build` in `frontend/`
      produces `.next/standalone/` and the standalone server (with
      `HOSTNAME=0.0.0.0 PORT=3001`) serves `/` and `/agents`.
- [ ] `api/src/seed/seed.ts` exposes its logic as an exported function; running
      `npm run seed` and `npm run db:reset` in `api/` behaves exactly as before
      (wipe + reseed).
- [ ] A seed-if-empty entry exists (`db:seed:if-empty` script → compiled JS):
      against a populated DB it makes no changes and logs "skipped"; against a
      freshly migrated empty DB it seeds and logs "seeded".
- [ ] `api/`: `npm test` and `npm run test:e2e` green; `frontend/`: `npm test`
      green; `nest build` and `next build` clean. Counts unchanged from Phase 3
      except any tests added for the seed refactor.
- [ ] `oxlint` (api) / `eslint` (frontend) clean.

## API image

- [ ] `docker build -f api/Dockerfile .` (from the app root) succeeds; it is a
      multi-stage build on `node:24-slim`.
- [ ] The runtime image has **no** build toolchain (`gcc`/`make`/`python3`
      absent) and **no** dev dependencies; it contains `dist/` and a production
      `node_modules` with a working compiled `better-sqlite3`.
- [ ] Running the image with `DATABASE_PATH=/data/clinic.sqlite` and an empty
      volume: the entrypoint runs migrations, then seeds (because empty), then
      starts the API; `GET /health` → `200 {status:"ok",...}` and `GET /agents`
      returns the seeded agents.
- [ ] Restarting the container against the **same** volume: migrations run
      (no-op), seed is **skipped**, previously created data is intact.
- [ ] `GET /dev` → `404` in the container (`NODE_ENV=production`, override not
      set).
- [ ] The image declares a `HEALTHCHECK` with a `start_period`; `docker inspect`
      shows the container reaching `healthy` on a fresh volume (first-boot
      migrate + seed does not trip it).
- [ ] The container runs as a non-root user and can write `clinic.sqlite` to the
      fresh `/data` volume (ownership set in the Dockerfile before first mount).

## Frontend image

- [ ] `docker build -f frontend/Dockerfile --build-arg
      NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 .` (from the app root)
      succeeds; multi-stage on `node:24-slim`.
- [ ] The runtime image serves the **production** build (standalone server),
      never `next dev`; it does not contain the full `node_modules` or source
      that the standalone trace excludes.
- [ ] The home page and `/agents` render with no module-not-found. (`@clinic/types`
      is type-only and erased at build — nothing to resolve at runtime; this
      check just confirms the standalone layout is otherwise complete.)
- [ ] The built client bundle has `http://localhost:3000` (the `API_PORT`
      default) inlined — the `NEXT_PUBLIC_API_BASE_URL` build arg took effect.
- [ ] Running the image alone (no API): `/` renders, `/agents` renders its
      API-unavailable state — no crash.
- [ ] The container runs as a non-root user and listens on `3001` (bound
      `0.0.0.0`, reachable from the host).

## docker-compose.yml (app root)

- [ ] `docker compose up --build` from `apps/agent-health-clinic/` builds both
      images, brings up `api` then `frontend` (frontend waits for the `api`
      healthcheck), with `api` on `3000` and `frontend` on `3001`.
- [ ] <http://localhost:3001> serves the home page and it shows **API: ok**
      (browser → `http://localhost:3000/health` succeeds; CORS allows the
      `http://localhost:3001` origin).
- [ ] `/agents` in the browser lists the seeded agents and a check-in creates a
      new one (full Phase 3 flow works through the containerized stack).
- [ ] The SQLite file lives on a **named volume**; `docker volume ls` shows it.
- [ ] Persistence: create an agent → `docker compose down` → `docker compose
      up` → the agent is still listed (seed did not re-run).
- [ ] Clean slate: `docker compose down -v` → `docker compose up` → only the
      demo seed data is present.
- [ ] `docker compose config` is valid with no `.env` present (defaults) and
      with a `.env` overriding `API_PORT` / `FRONTEND_PORT` — and the rendered
      `FRONTEND_ORIGIN` and frontend `NEXT_PUBLIC_API_BASE_URL` build arg both
      track the overridden ports (derived, not independently set).
- [ ] With `API_PORT` overridden and `--build`, the browser round-trip still
      works (bundle rebuilt against the new port, CORS origin still matches).
- [ ] No `version:` key; a stable project name is set.

## .env, .dockerignore, Makefile

- [ ] `.env.example` at the app root lists **only** `API_PORT` and
      `FRONTEND_PORT`, with the "`API_PORT` change needs `--build`" note and a
      note that it is distinct from `frontend/.env.local.example`; the app-root
      `.gitignore` ignores `.env` (and `docker-compose.override.yml`) and keeps
      `.env.example` tracked.
- [ ] `.dockerignore` at the app root excludes `node_modules`, `.next`,
      `api/dist`, `coverage`, `*.sqlite*`, `.git`, `specs`, local `.env` — and
      **keeps** `packages/types/dist` and the lockfiles. Build-context transfer
      size is small (logged).
- [ ] `Makefile` at the app root: `make up`, `make down`, `make clean`,
      `make logs`, `make seed`, `make reset`, `make build` each run the
      expected compose command; `make up` then `make clean` round-trips.
      `make reset` clears `clinic.sqlite*` (incl. `-wal` / `-shm`).

## CI

- [ ] `.github/workflows/*.yml` at the **monorepo root** builds both images and
      runs the smoke test (`up -d`, wait for `api` healthy, `curl` `/` and
      `/health` for `200`, `down -v` always), scoped to
      `apps/agent-health-clinic/**` paths, with Buildx layer caching.
- [ ] The smoke test includes a **cross-service** check: a request to
      `http://localhost:3000/agents` sent with `Origin: http://localhost:3001`
      comes back with a matching `Access-Control-Allow-Origin` and the seeded
      agents (or an equivalent headless Playwright check of the frontend).
- [ ] The workflow passes on this branch's PR.

## Docs

- [ ] `apps/agent-health-clinic/README.md` has a "Run with Docker" section
      **alongside** the two-terminal flow: the one command, URLs, `.env` step
      (and that it is not `frontend/.env.local.example`), seed/persistence
      behaviour, `down` vs `down -v`, the "`API_PORT` change needs `--build`"
      note, the `make` targets, and the `/dev`-off-in-container note.
- [ ] `api/README.md` documents the container entrypoint (migrate-always /
      seed-if-empty), that `DatabaseModule` relies on the entrypoint for
      migrations, the `db:seed:if-empty` script, and container `DATABASE_PATH`.
- [ ] `CHANGELOG.md` updated via the `changelog` skill.

## Responsive (manual)

- [ ] The containerized frontend at <http://localhost:3001> — home and
      `/agents` — checked at ~375px, ~768px, ~1280px: renders identically to the
      local-dev build, no horizontal scroll. (This phase does not touch UI; the
      check confirms the production build did not regress responsiveness.)

## Ready to merge when

- [ ] All boxes above are checked.
- [ ] Scope held: no product feature/endpoint/UI/schema change (only the
      `seed.ts` refactor); no cloud deploy, no image registry/push, no Postgres,
      no dev-mode/hot-reload compose, no workspace tooling, no multi-arch, no
      distroless, `/dev` UI and the two-terminal instructions untouched.
- [ ] `docker compose up --build` from the app root is the single command that
      brings up a working stack at <http://localhost:3001>; teardown
      (`down` / `down -v`) is documented and returns to a clean state.
- [ ] All `plan.md` task groups complete.
