# Validation — Containerization & one-command run

This phase is done when every box below is checked. It validates that both
services build as slim multi-stage images and run together with one command,
with the SQLite data seeded on first run and persisted afterwards — and with
**no product behaviour changed** from Phase 3.

Verify from a clean checkout of the branch, with Docker running, `cwd` =
`apps/agent-health-clinic/`.

> **Status (2026-08-30):** validated on Docker Engine 29.7.2 / Compose v5.5.0
> (native, WSL2 Ubuntu 24.04). Automated checks run against the live stack; the
> maintainer additionally ran `docker compose up --build` / `down` by hand and
> confirmed the app renders and works in the browser. Still open: the manual
> responsive check at 375/768/1280px; the CI workflow needs a PR run; `make`
> targets are unverified because `make` is not installed (`sudo apt install
> make`) — the wrapped `docker compose …` commands all work.

## App changes (no behaviour change)

- [x] `frontend/next.config.ts` sets `output: "standalone"`,
      `outputFileTracingRoot` at the app root, and keeps
      `transpilePackages: ["@clinic/types"]`; `npm run build` in `frontend/`
      produces `.next/standalone/` and the standalone server (with
      `HOSTNAME=0.0.0.0 PORT=3001`) serves `/` and `/agents`.
- [x] `api/src/seed/seed.ts` exposes its logic as an exported function; running
      `npm run seed` and `npm run db:reset` in `api/` behaves exactly as before
      (wipe + reseed).
- [x] A seed-if-empty entry exists (`db:seed:if-empty` script → compiled JS):
      against a populated DB it makes no changes and logs "skipped"; against a
      freshly migrated empty DB it seeds and logs "seeded".
- [x] `api/`: `npm test` (35) and `npm run test:e2e` (16) green; `frontend/`:
      `npm test` (13) green; `nest build` and `next build` clean. Test counts
      unchanged from Phase 3.
- [x] `oxlint` (api) / `eslint` (frontend) clean.

## API image

- [x] `docker build -f api/Dockerfile .` (from the app root) succeeds; it is a
      multi-stage build on `node:24-slim`. *(`docker compose build`; 442MB.)*
- [x] The runtime image has **no** build toolchain (`gcc`/`make`/`python3`
      absent) and **no** dev dependencies; it contains `dist/` and a production
      `node_modules` with a working compiled `better-sqlite3`. *(`which gcc g++
      make python3` → none; `@nestjs/cli` absent; `require('better-sqlite3')`
      OK.)*
- [x] Running the image with `DATABASE_PATH=/data/clinic.sqlite` and an empty
      volume: the entrypoint runs migrations, then seeds (because empty), then
      starts the API; `GET /health` → `200 {status:"ok",...}` and `GET /agents`
      returns the seeded agents.
- [x] Restarting the container against the **same** volume: migrations run
      (no-op — "No pending migrations"), seed is **skipped** ("already has 4
      agent(s)"), previously created data is intact.
- [x] `GET /dev` → `404` in the container (`NODE_ENV=production`, override not
      set).
- [x] The image declares a `HEALTHCHECK` with a `start_period`; `docker inspect`
      shows the container reaching `healthy` on a fresh volume (first-boot
      migrate + seed does not trip it).
- [x] The container runs as a non-root user (`uid=1000(node)`) and can write
      `clinic.sqlite` to the fresh `/data` volume (ownership set in the
      Dockerfile before first mount).

## Frontend image

- [x] `docker build -f frontend/Dockerfile --build-arg
      NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 .` (from the app root)
      succeeds; multi-stage on `node:24-slim`. *(via compose build; 385MB.)*
- [x] The runtime image serves the **production** build (standalone server),
      never `next dev`; it does not contain the full `node_modules` or source
      that the standalone trace excludes.
- [x] The home page and `/agents` render with no module-not-found.
- [x] The built client bundle has `http://localhost:3000` (the `API_PORT`
      default) inlined — the `NEXT_PUBLIC_API_BASE_URL` build arg took effect.
      *(`grep` of `.next/static` in the container.)*
- [x] Running the image alone (no API): `/` renders, `/agents` renders its
      API-unavailable state — no crash. *(verified pre-compose during the
      standalone-layout smoke test.)*
- [x] The container runs as a non-root user (`uid=1000(node)`) and listens on
      `3001` (bound `0.0.0.0`, reachable from the host).

## docker-compose.yml (app root)

- [x] `docker compose up --build` from `apps/agent-health-clinic/` builds both
      images, brings up `api` then `frontend` (frontend waits for the `api`
      healthcheck), with `api` on `3000` and `frontend` on `3001`.
- [x] <http://localhost:3001> serves the home page and it shows **API: ok**.
      *Maintainer confirmed in the browser. Automated backing: page 200,
      `http://localhost:3000/health` 200, API URL baked into the client bundle,
      `/agents` with `Origin: http://localhost:3001` returns a matching
      `Access-Control-Allow-Origin`.*
- [x] `/agents` lists the seeded agents and a check-in creates a new one.
      *Maintainer confirmed the app works in the browser; `GET /agents` returns
      `[Claude, Pixel, Ada]` and `POST /agents` → `201` and persists.*
- [x] The SQLite file lives on a **named volume**; `docker volume ls` shows
      `agent-health-clinic_clinic-db`.
- [x] Persistence: create an agent → `docker compose down` → `docker compose
      up` → the agent is still listed (seed did not re-run).
- [x] Clean slate: `docker compose down -v` → `docker compose up` → only the
      demo seed data is present (`[Claude, Pixel, Ada]`).
- [x] `docker compose config` is valid with no `.env` (defaults →
      `FRONTEND_ORIGIN=http://localhost:3001`,
      `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000`) and with a `.env`
      overriding the ports (→ `:4001` / `:4000`) — both derived, not
      independently set.
- [x] With `API_PORT=4000` overridden and `--build`, the browser round-trip
      still works: bundle rebuilt with `http://localhost:4000`, CORS origin
      `http://localhost:4001`, both services reachable on the new ports.
- [x] No `version:` key; `name: agent-health-clinic` set.

## .env, .dockerignore, Makefile

- [x] `.env.example` at the app root lists **only** `API_PORT` and
      `FRONTEND_PORT`, with the "`API_PORT` change needs `--build`" note and a
      note that it is distinct from `frontend/.env.local.example`; the app-root
      `.gitignore` ignores `.env` (and `docker-compose.override.yml`) and keeps
      `.env.example` tracked.
- [x] `.dockerignore` at the app root excludes `node_modules`, `.next`,
      `api/dist`, `coverage`, `*.sqlite*`, `.git`, `specs`, local `.env` — and
      **keeps** `packages/types/dist` and the lockfiles. Build-context transfer
      is ~4kB (logged).
- [ ] `Makefile` at the app root has `up` / `up-d` / `down` / `clean` / `logs` /
      `seed` / `reset` / `build` targets, each a thin compose wrapper; `reset`
      globs `clinic.sqlite*`. *Recipes reviewed; not executed — `make` is not
      installed on this machine (`sudo apt install make` to use them). The raw
      `docker compose` commands they wrap are all verified.*

## CI

- [x] `.github/workflows/agent-health-clinic-docker.yml` at the **monorepo
      root** builds both images (bake + `type=gha` cache) and runs the smoke
      test (`up -d`, wait for `api` healthy, `curl` `/` and `/health` for `200`,
      `down -v` always, logs on failure), scoped to `apps/agent-health-clinic/**`.
- [x] The smoke test includes a **cross-service** check: `GET /agents` with
      `Origin: http://localhost:3001` must return a matching
      `Access-Control-Allow-Origin` and list a seeded agent. *(Same check run
      by hand against the live stack — passes.)*
- [ ] The workflow passes on this branch's PR. *(needs the PR pushed.)*

## Docs

- [x] `apps/agent-health-clinic/README.md` has a "Run with Docker" section
      **alongside** the two-terminal flow: the one command, URLs, `.env` step
      (and that it is not `frontend/.env.local.example`), seed/persistence
      behaviour, `down` vs `down -v`, the "`API_PORT` change needs `--build`"
      note, the `make` targets, and the `/dev`-off-in-container note.
- [x] `api/README.md` documents the container entrypoint (migrate-always /
      seed-if-empty), that `DatabaseModule` relies on the entrypoint for
      migrations, the `db:seed:if-empty` script, and container `DATABASE_PATH`.
- [x] `CHANGELOG.md` updated via the `changelog` skill.

## Responsive (manual)

- [ ] The containerized frontend at <http://localhost:3001> — home and
      `/agents` — checked at ~375px, ~768px, ~1280px: renders identically to the
      local-dev build, no horizontal scroll. *(needs a browser; production build
      renders the same markup/CSS as local dev, which was checked in Phases 2–3.
      Viewport meta present in the served HTML.)*

## Ready to merge when

- [ ] All boxes above are checked. *(open: CI PR run; manual responsive check;
      `make` targets — need `make` installed.)*
- [x] Scope held: no product feature/endpoint/UI/schema change (only the
      `seed.ts` refactor); no cloud deploy, no image registry/push, no Postgres,
      no dev-mode/hot-reload compose, no workspace tooling, no multi-arch, no
      distroless, `/dev` UI and the two-terminal instructions untouched.
- [x] `docker compose up --build` from the app root is the single command that
      brings up a working stack at <http://localhost:3001>; teardown
      (`down` / `down -v`) is documented and returns to a clean state.
- [x] All `plan.md` task groups complete.
