# Plan — Containerization & one-command run

Task groups in dependency order. Group 1 makes the two apps container-friendly
(small code/config changes). Groups 2–3 build the images and can proceed in
parallel once group 1 lands. Group 4 wires them with Compose. Groups 5–7 add the
ergonomics layer (`.env`, Makefile, CI). Group 8 is docs + validation wrap-up.

No product behaviour changes in this phase — only packaging, config, and one
`seed.ts` refactor.

## 1. App changes for containerization

1.1. **Frontend standalone output** — in `frontend/next.config.ts` add
     `output: "standalone"` and `outputFileTracingRoot` pointed at the app root
     (`path.join(__dirname, "..")`), because `@clinic/types` sits in a sibling
     `packages/` dir. Keep `transpilePackages: ["@clinic/types"]`. Run `npm run
     build` locally and confirm `.next/standalone/` is produced, note the exact
     path the server file lands at (it may be `.next/standalone/frontend/server.js`
     because the build runs in a subdir), and confirm that starting it (with
     `.next/static` and `public` in place, `HOSTNAME=0.0.0.0 PORT=3001`) serves
     `/` and `/agents`. `@clinic/types` is type-only so it will not appear in the
     trace — that is correct, not a bug.
1.2. **Seed refactor** — in `api/src/seed/seed.ts`, extract the seeding logic
     into an exported `async function seed(dataSource?)` (or `seedDatabase`)
     that callers can invoke; keep the existing script behaviour (initialize
     the standalone `AppDataSource`, wipe the four tables, insert, destroy) when
     run directly (`npm run seed` / `db:reset` unchanged).
1.3. **Seed-if-empty entry** — add either a `--if-empty` branch to the seed
     script or a `api/src/seed/seed-if-empty.ts` that: initializes
     `AppDataSource`, checks whether the DB has data (`SELECT COUNT(*) FROM
     "agent"` — guard for the table not existing yet), and only calls `seed()`
     when empty; logs which path it took. Add a `db:seed:if-empty` npm script
     (`npm run build && node dist/seed/seed-if-empty.js`).
1.4. Sanity: `npm test` + `npm run test:e2e` in `api/`, `npm test` in
     `frontend/`, `nest build`, `next build` all still green after 1.1–1.3.

## 2. API image (`api/Dockerfile`)

2.1. Multi-stage `Dockerfile` at `api/Dockerfile`, base `node:24-slim` for
     every stage. Build context is the app root (see group 4), so paths are
     `api/...` and `packages/types/...`.
2.2. **deps/build stage**: `apt-get install -y --no-install-recommends python3
     make g++`; copy `packages/types/` (incl. committed `dist/`),
     `api/package.json`, `api/package-lock.json`; `npm ci` in `api/`; copy the
     rest of `api/`; `npm run build`.
2.3. **prod-deps** (dedicated stage or reuse): produce a `node_modules` with
     `npm ci --omit=dev` (build toolchain present so `better-sqlite3` compiles),
     against the same `packages/types/`.
2.4. **runtime stage**: `node:24-slim`, `NODE_ENV=production`,
     `WORKDIR /app/api`. Copy the prod `node_modules` and `api/dist` (and
     `packages/types/` only if the symlink/layout needs it — type-only, so the
     compiled `dist/` does not reference it). No `.ts`, no dev deps, no compiler.
     Create the non-root user, `RUN mkdir -p /data && chown -R <user> /app /data`
     **before** any `VOLUME`/first mount, then `USER <user>`, so a fresh named
     volume at `/data` inherits non-root ownership.
2.5. Add an **entrypoint** (`api/docker-entrypoint.sh`, copied in and
     `chmod +x`): run `node dist/database/run-migrations.js`, then
     `node dist/seed/seed-if-empty.js`, then `exec node dist/main.js`. `EXPOSE
     3000`. `CMD` / `ENTRYPOINT` set accordingly.
2.6. `HEALTHCHECK --interval=10s --timeout=3s --retries=5 --start-period=30s
     CMD` a Node one-liner that `fetch`es `http://localhost:${PORT:-3000}/health`
     and exits non-zero unless `res.ok`. (`start-period` covers first-boot
     migrate + seed.)
2.7. Build it standalone for now (`docker build -f api/Dockerfile .` from the
     app root) and run with `-e DATABASE_PATH=/data/clinic.sqlite -v
     clinic-test:/data -p 3000:3000`; confirm migrations run, seed populates,
     `GET /health` and `GET /agents` respond, and `/dev` is **404**
     (`NODE_ENV=production`).

## 3. Frontend image (`frontend/Dockerfile`)

3.1. Multi-stage `Dockerfile` at `frontend/Dockerfile`, base `node:24-slim`.
3.2. **build stage**: copy `packages/types/`, `frontend/package.json` +
     lockfile; `npm ci`; copy the rest of `frontend/`; declare `ARG
     NEXT_PUBLIC_API_BASE_URL=http://localhost:3000` and export it to `ENV`
     before `npm run build`.
3.3. **runtime stage**: `node:24-slim`, `NODE_ENV=production`, non-root user,
     `WORKDIR /app/frontend`. Copy `.next/standalone` (traced server + minimal
     `node_modules`), `.next/static`, and `public` into the layout the standalone
     server expects. `ENV HOSTNAME=0.0.0.0 PORT=3001` (the standalone server
     reads these, not a `-p` flag; recent Next defaults `HOSTNAME` to
     `localhost`, unreachable from outside the container). `EXPOSE 3001`.
     `CMD ["node", "server.js"]` at the path the standalone build actually emits
     (check 1.1 — likely `frontend/server.js`).
3.4. (Optional) a `HEALTHCHECK` fetching `http://localhost:3001/`.
3.5. Build standalone (`docker build -f frontend/Dockerfile
     --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 .`) and run
     `-p 3001:3001`; confirm `/` renders and `/agents` loads (it will show an
     API-error state with no API running — that is correct). Also grep the built
     client bundle for the baked-in `http://localhost:3000` string to confirm the
     build arg was inlined.

## 4. docker-compose.yml

4.1. `apps/agent-health-clinic/docker-compose.yml` with services `api` and
     `frontend`:
     - `api`: `build: { context: ., dockerfile: api/Dockerfile }`;
       `ports: ["${API_PORT:-3000}:3000"]`;
       `environment: FRONTEND_ORIGIN=http://localhost:${FRONTEND_PORT:-3001}`
       (derived from the port knob, not a separate var),
       `DATABASE_PATH=/data/clinic.sqlite`, `NODE_ENV=production`;
       `volumes: [clinic-db:/data]`;
       `healthcheck` on `/health` with `start_period: 30s` (reuse the Dockerfile
       probe or inline it).
     - `frontend`: `build: { context: ., dockerfile: frontend/Dockerfile,
       args: { NEXT_PUBLIC_API_BASE_URL: "http://localhost:${API_PORT:-3000}" } }`
       (derived from the same port knob);
       `ports: ["${FRONTEND_PORT:-3001}:3001"]`;
       `depends_on: { api: { condition: service_healthy } }`.
4.2. `volumes: { clinic-db: {} }` (named volume).
4.3. No `version:` key (obsolete in current Compose). Use a project name
     (`name: agent-health-clinic`) so volume / container names are stable.
4.4. `docker compose up --build` from the app root: both images build, `api`
     goes healthy, `frontend` starts after it, <http://localhost:3001> serves
     the home page showing **API: ok**, and `/agents` round-trips through the
     API. `docker compose down` stops; `docker compose down -v` drops the
     volume.
4.5. Restart-persistence check: create an agent via the UI, `docker compose
     down`, `docker compose up`, confirm the agent is still there (seed did not
     re-run). Then `down -v` + `up` and confirm demo seed data is back.

## 5. Compose .env

5.1. `apps/agent-health-clinic/.env.example` listing **only** `API_PORT=3000`
     and `FRONTEND_PORT=3001`, with comments: `.env` is optional (defaults
     work); `FRONTEND_ORIGIN` / `NEXT_PUBLIC_API_BASE_URL` are derived from these
     by `docker-compose.yml` and must not be set here; changing `API_PORT` needs
     `docker compose up --build` (baked into the frontend bundle). Note it is a
     different file from `frontend/.env.local.example` (two-terminal flow only).
5.2. New `apps/agent-health-clinic/.gitignore` (or add to an existing rule):
     ignore `.env`, keep `.env.example`. Also ignore any local
     `docker-compose.override.yml`.
5.3. Confirm `docker compose config` resolves variables correctly both with no
     `.env` (defaults) and with a `.env` overriding `API_PORT` — check the
     rendered `FRONTEND_ORIGIN` and the frontend build arg both track the new
     port.

## 6. .dockerignore

6.1. `apps/agent-health-clinic/.dockerignore`: exclude `**/node_modules`,
     `**/.next`, `api/dist`, `**/coverage`, `**/*.sqlite*`, `**/*.tsbuildinfo`,
     `.git`, `.github`, `specs`, `**/.env`, `**/.env.local`, editor/OS cruft.
     **Do not** exclude `packages/types/dist` or any `package-lock.json`.
6.2. Rebuild both images and confirm the build context upload is small (log the
     "transferring context" size) and images still work — in particular that
     `nest build` / `next build` still typecheck against
     `packages/types/dist/*.d.ts` (it was not ignored).

## 7. Makefile

7.1. `apps/agent-health-clinic/Makefile` with `.PHONY` targets, each a thin
     wrapper:
     - `up` → `docker compose up --build`
     - `up-d` → `docker compose up --build -d`
     - `down` → `docker compose down`
     - `clean` → `docker compose down -v`
     - `logs` → `docker compose logs -f`
     - `seed` → `docker compose exec api node dist/seed/seed.js`
       (force reseed inside the running container)
     - `reset` → `docker compose exec api sh -c 'rm -f /data/clinic.sqlite* &&
       node dist/database/run-migrations.js && node dist/seed/seed.js'`
       (the glob also clears `-wal` / `-shm`)
     - `build` → `docker compose build`
7.2. `make up` then `make clean` round-trips cleanly.

## 8. CI — Docker build & cross-service smoke test

8.1. `.github/workflows/docker.yml` **at the monorepo root**
     (`/home/dawid/projects/deeplearning-spec-driven-dev/.github/workflows/`),
     triggered `on: pull_request` with
     `paths: ['apps/agent-health-clinic/**']` (and `workflow_dispatch`).
8.2. Job steps: checkout; `docker/setup-buildx-action`; `docker compose
     -f apps/agent-health-clinic/docker-compose.yml build` with GH Actions
     layer cache (`cache-from`/`cache-to: type=gha`, via
     `docker/bake-action` or `COMPOSE_BAKE=true` + buildx, whichever is
     simplest); `docker compose ... up -d`; poll until the `api` container is
     healthy (timeout ~90s); `curl -fsS http://localhost:3000/health` and
     `curl -fsS http://localhost:3001` must return `200`; always run
     `docker compose ... down -v` in a final step; on failure dump
     `docker compose logs`.
8.2a. **Cross-service check** (the point of the phase — do not skip): after
     `up -d`, either
     - a scripted request: `curl -fsS -H 'Origin: http://localhost:3001'
       http://localhost:3000/agents` and assert the response has
       `Access-Control-Allow-Origin: http://localhost:3001` and lists the seeded
       agents; or
     - a headless Playwright job: load `http://localhost:3001`, assert the
       health widget reads "API: ok", open `/agents`, assert seeded agents
       render.
     The `curl` option is lighter and sufficient; Playwright if a browser dep is
     already warranted.
8.3. Push the branch and confirm the workflow passes on the PR.

## 9. Docs & wrap-up

9.1. **`apps/agent-health-clinic/README.md`** — add a "Run with Docker"
     section *alongside* "Running locally" (do not remove the two-terminal
     flow):
     - `cp .env.example .env` (optional) — two knobs, `API_PORT` /
       `FRONTEND_PORT`; make clear this `.env` is not the same as
       `frontend/.env.local.example`
     - `docker compose up --build` from the app root → <http://localhost:3001>
     - what comes seeded, how persistence works, `down` vs `down -v`
     - the "changing `API_PORT` needs `--build`" note
     - the `make` targets
     - note that `/dev` is not available in the container (`NODE_ENV=production`)
9.2. **`api/README.md`** — document the container entrypoint (migrate-always,
     seed-if-empty), the new `db:seed:if-empty` script, and `DATABASE_PATH`
     pointing at the mounted volume in the container.
9.3. **`CHANGELOG.md`** — update via the `changelog` skill.
9.4. Walk `validation.md` top to bottom, ticking boxes; open for review/merge
     when all are checked.

## Notes for the implementer

- **Build context is the app root** for both Dockerfiles. Every `COPY` path is
  `api/...`, `frontend/...`, or `packages/types/...`. `docker build` / `docker
  compose` are always run from `apps/agent-health-clinic/`.
- `@clinic/types` is **types-only** — no runtime code, every consumer uses
  `import type`. So it is fully erased at compile time: `api/dist` and the Next
  client/standalone bundle contain no reference to it, and neither runtime image
  needs it resolvable. The **build** stages do need its `dist/*.d.ts` for the
  typecheck — copy `packages/types/` **before** `npm ci` in each app, in a
  cache-friendly order (package manifests first where practical).
- `@clinic/types` has a `prepare` script (`tsc`). Its `dist/` is committed but
  its `node_modules` is **not** vendored (gitignored). Local `npm install`
  resolves the `file:` dep by symlink and skips `prepare`, so this is fine; if a
  Docker `npm ci` is observed running `prepare` and failing, fall back to
  `--ignore-scripts` for that install (see requirements "Open questions").
- `api/` is ESM (`"type": "module"`) with explicit `.js` import specifiers and
  compiles to `dist/` via `nest build`. The entrypoint and seed-if-empty script
  run the **compiled** `.js` under `dist/`, not `ts-node`.
- `better-sqlite3` is a native module: `python3` + `make` + `g++` are needed
  wherever `npm ci` runs, and **not** in the runtime stage. Verify the compiled
  `.node` binary makes it into the runtime image (copied with `node_modules`).
- Next 16 `output: "standalone"` emits `server.js` and a pruned `node_modules`
  under `.next/standalone/`; the exact copy layout (`frontend/` prefix inside
  standalone because the build runs in a subdir) needs checking against the
  actual build output — see `frontend/AGENTS.md` re: Next 16 differences from
  training data. Set `outputFileTracingRoot` to the app root so the trace root
  is stable regardless of where `next build` is invoked. The standalone server
  binds via `HOSTNAME` / `PORT` env vars — set `HOSTNAME=0.0.0.0`, `PORT=3001`
  in the runtime stage.
- Keep `main.ts` / `data-source.ts` / `app-config.ts` unchanged — they already
  read `PORT`, `FRONTEND_ORIGIN`, `DATABASE_PATH` from env. The only API source
  change is the `seed.ts` refactor + the new seed-if-empty entry.
- `DatabaseModule` has no `migrationsRun` / `migrations` — the running app never
  applies migrations. The container entrypoint MUST run
  `dist/database/run-migrations.js` before `dist/main.js`; without it the app
  starts against a schema-less DB.
- All frontend API calls are client-side (`"use client"` components only, no RSC
  fetch of the API) — verified. One host-origin API base URL is correct for
  every call; there is no server-side `http://api:3000` URL to add.
- CI workflow file must live at the **monorepo** `.git` root's `.github/`, but
  everything it runs is scoped to `apps/agent-health-clinic/` via `-f` and
  `paths:`.
- Non-root runtime user in both images. For the API: `mkdir /data` and
  `chown -R <user> /app /data` in the Dockerfile **before** the first mount /
  `USER`, so a fresh named volume inherits non-root ownership and the entrypoint
  can create `clinic.sqlite`. (Docker seeds a new named volume from the image
  path's contents *and ownership*.)
