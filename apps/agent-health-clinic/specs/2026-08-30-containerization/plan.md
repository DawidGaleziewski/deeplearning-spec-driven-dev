# Plan — Containerization & one-command run

Task groups in dependency order. Group 1 makes the two apps container-friendly
(small code/config changes). Groups 2–3 build the images and can proceed in
parallel once group 1 lands. Group 4 wires them with Compose. Groups 5–7 add the
ergonomics layer (`.env`, Makefile, CI). Group 8 is docs + validation wrap-up.

No product behaviour changes in this phase — only packaging, config, and one
`seed.ts` refactor.

## 1. App changes for containerization

1.1. **Frontend standalone output** — add `output: "standalone"` to
     `frontend/next.config.ts`. Keep `transpilePackages: ["@clinic/types"]`.
     Run `npm run build` locally and confirm `.next/standalone/` is produced and
     that starting it (`node .next/standalone/server.js` with `.next/static` and
     `public` in place) serves `/` and `/agents`.
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
2.4. **runtime stage**: `node:24-slim`, `NODE_ENV=production`, non-root user,
     `WORKDIR /app/api`. Copy `packages/types/` (dist only needed), the prod
     `node_modules`, and `api/dist`. No `.ts`, no dev deps, no compiler.
2.5. Add an **entrypoint** (`api/docker-entrypoint.sh`, copied in and
     `chmod +x`): run `node dist/database/run-migrations.js`, then
     `node dist/seed/seed-if-empty.js`, then `exec node dist/main.js`. `EXPOSE
     3000`. `CMD` / `ENTRYPOINT` set accordingly.
2.6. `HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD` a Node one-liner
     that `fetch`es `http://localhost:${PORT:-3000}/health` and exits non-zero
     unless `res.ok`.
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
     `WORKDIR /app/frontend`. Copy `.next/standalone` (which includes the
     traced server + minimal `node_modules` + `@clinic/types`), `.next/static`,
     and `public` into the layout the standalone server expects. `EXPOSE 3001`.
     `CMD ["node", "frontend/server.js"]` (or the path the standalone build
     emits) — bind host `0.0.0.0`, port `3001`.
3.4. (Optional) a `HEALTHCHECK` fetching `http://localhost:3001/`.
3.5. Build standalone (`docker build -f frontend/Dockerfile
     --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 .`) and run
     `-p 3001:3001`; confirm `/` renders and `/agents` loads (it will show an
     API-error state with no API running — that is correct).

## 4. docker-compose.yml

4.1. `apps/agent-health-clinic/docker-compose.yml` with services `api` and
     `frontend`:
     - `api`: `build: { context: ., dockerfile: api/Dockerfile }`;
       `ports: ["${API_PORT:-3000}:3000"]`;
       `environment: FRONTEND_ORIGIN=${FRONTEND_ORIGIN:-http://localhost:3001}`,
       `DATABASE_PATH=/data/clinic.sqlite`, `NODE_ENV=production`;
       `volumes: [clinic-db:/data]`;
       `healthcheck` on `/health` (reuse the Dockerfile probe or inline it).
     - `frontend`: `build: { context: ., dockerfile: frontend/Dockerfile,
       args: { NEXT_PUBLIC_API_BASE_URL: ${NEXT_PUBLIC_API_BASE_URL:-http://localhost:3000} } }`;
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

5.1. `apps/agent-health-clinic/.env.example` listing `API_PORT=3000`,
     `FRONTEND_PORT=3001`, `FRONTEND_ORIGIN=http://localhost:3001`,
     `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000` with a comment that
     `.env` is optional (defaults work) and that changing
     `NEXT_PUBLIC_API_BASE_URL` needs `--build`.
5.2. New `apps/agent-health-clinic/.gitignore` (or add to an existing rule):
     ignore `.env`, keep `.env.example`. Also ignore any local
     `docker-compose.override.yml`.
5.3. Confirm `docker compose config` resolves variables correctly both with no
     `.env` (defaults) and with a `.env` overriding a port.

## 6. .dockerignore

6.1. `apps/agent-health-clinic/.dockerignore`: exclude `**/node_modules`,
     `**/.next`, `api/dist`, `**/coverage`, `**/*.sqlite*`, `**/*.tsbuildinfo`,
     `.git`, `.github`, `specs`, `**/.env`, `**/.env.local`, editor/OS cruft.
     **Do not** exclude `packages/types/dist` or any `package-lock.json`.
6.2. Rebuild both images and confirm the build context upload is small (log the
     "transferring context" size) and images still work — in particular that
     `@clinic/types` still resolves (its `dist/` was not ignored).

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
     - `reset` → `docker compose exec api sh -c 'rm -f /data/clinic.sqlite &&
       node dist/database/run-migrations.js && node dist/seed/seed.js'`
     - `build` → `docker compose build`
7.2. `make up` then `make clean` round-trips cleanly.

## 8. CI — Docker build & smoke test

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
8.3. Push the branch and confirm the workflow passes on the PR.

## 9. Docs & wrap-up

9.1. **`apps/agent-health-clinic/README.md`** — add a "Run with Docker"
     section *alongside* "Running locally" (do not remove the two-terminal
     flow):
     - `cp .env.example .env` (optional)
     - `docker compose up --build` from the app root → <http://localhost:3001>
     - what comes seeded, how persistence works, `down` vs `down -v`
     - the `NEXT_PUBLIC_API_BASE_URL` rebuild note
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
- `@clinic/types` has a `prepare` script (`npm run build`) that runs on `file:`
  install; its `dist/` is committed and its `typescript` devDep is vendored, so
  the install is self-contained. Copy `packages/types/` **before** `npm ci` in
  each app so the `file:` dep resolves, and copy it in a cache-friendly order
  (package manifests first where practical).
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
  training data.
- Keep `main.ts` / `data-source.ts` / `app-config.ts` unchanged — they already
  read `PORT`, `FRONTEND_ORIGIN`, `DATABASE_PATH` from env. The only API source
  change is the `seed.ts` refactor + the new seed-if-empty entry.
- CI workflow file must live at the **monorepo** `.git` root's `.github/`, but
  everything it runs is scoped to `apps/agent-health-clinic/` via `-f` and
  `paths:`.
- Non-root runtime user in both images (create a user, `chown` the app dir and
  — for the API — the `/data` mount point, or rely on the volume being
  writable).
