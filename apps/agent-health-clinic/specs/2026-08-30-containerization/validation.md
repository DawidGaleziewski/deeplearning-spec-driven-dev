# Validation — Containerization & one-command run

This phase is done when every box below is checked. It validates that both
services build as slim multi-stage images and run together with one command,
with the SQLite data seeded on first run and persisted afterwards — and with
**no product behaviour changed** from Phase 3.

Verify from a clean checkout of the branch, with Docker running, `cwd` =
`apps/agent-health-clinic/`.

## App changes (no behaviour change)

- [ ] `frontend/next.config.ts` sets `output: "standalone"` and keeps
      `transpilePackages: ["@clinic/types"]`; `npm run build` in `frontend/`
      produces `.next/standalone/` and the standalone server serves `/` and
      `/agents`.
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
- [ ] The image declares a `HEALTHCHECK`; `docker inspect` shows the container
      reaching `healthy`.
- [ ] The container runs as a non-root user.

## Frontend image

- [ ] `docker build -f frontend/Dockerfile --build-arg
      NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 .` (from the app root)
      succeeds; multi-stage on `node:24-slim`.
- [ ] The runtime image serves the **production** build (standalone server / 
      `next start`), never `next dev`; it does not contain the full
      `node_modules` or source that the standalone trace excludes.
- [ ] `@clinic/types` resolves at runtime (the home page and `/agents` render;
      no module-not-found).
- [ ] Running the image alone (no API): `/` renders, `/agents` renders its
      API-unavailable state — no crash.
- [ ] The container runs as a non-root user and listens on `3001`.

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
      with a `.env` overriding `API_PORT` / `FRONTEND_PORT`.
- [ ] No `version:` key; a stable project name is set.

## .env, .dockerignore, Makefile

- [ ] `.env.example` at the app root lists `API_PORT`, `FRONTEND_PORT`,
      `FRONTEND_ORIGIN`, `NEXT_PUBLIC_API_BASE_URL` with the rebuild note; the
      app-root `.gitignore` ignores `.env` and keeps `.env.example` tracked.
- [ ] `.dockerignore` at the app root excludes `node_modules`, `.next`,
      `api/dist`, `coverage`, `*.sqlite*`, `.git`, `specs`, local `.env` — and
      **keeps** `packages/types/dist` and the lockfiles. Build-context transfer
      size is small (logged).
- [ ] `Makefile` at the app root: `make up`, `make down`, `make clean`,
      `make logs`, `make seed`, `make reset`, `make build` each run the
      expected compose command; `make up` then `make clean` round-trips.

## CI

- [ ] `.github/workflows/*.yml` at the **monorepo root** builds both images and
      runs a smoke test (`up -d`, wait for `api` healthy, `curl` `/` and
      `/health` for `200`, `down -v` always), scoped to
      `apps/agent-health-clinic/**` paths, with Buildx layer caching.
- [ ] The workflow passes on this branch's PR.

## Docs

- [ ] `apps/agent-health-clinic/README.md` has a "Run with Docker" section
      **alongside** the two-terminal flow: the one command, URLs, `.env` step,
      seed/persistence behaviour, `down` vs `down -v`, the
      `NEXT_PUBLIC_API_BASE_URL` rebuild note, the `make` targets, and the
      `/dev`-off-in-container note.
- [ ] `api/README.md` documents the container entrypoint (migrate-always /
      seed-if-empty), the `db:seed:if-empty` script, and container
      `DATABASE_PATH`.
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
