# syntax=docker/dockerfile:1
#
# Multi-stage build for the AgentClinic NestJS API.
# Build context is the APP ROOT (apps/agent-health-clinic/) so the
# `@clinic/types` `file:../packages/types` dependency resolves — every COPY path
# is `api/...` or `packages/types/...`.

# ---------------------------------------------------------------------------
# build — install all deps (incl. dev) and compile TS -> dist/
# ---------------------------------------------------------------------------
FROM node:24-slim AS build
# better-sqlite3 is a native module and node:24 has no prebuilt binary for its
# ABI yet — node-gyp needs a toolchain to compile it from source.
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
# `npm ci` runs the `prepare` (`tsc`) script of the `@clinic/types` `file:`
# dependency — unlike a local `npm install`, which symlinks and skips it. That
# package has no local `typescript`, so provide one build-wide. (Its committed
# dist/ is what actually ships; this just lets `prepare` succeed.)
RUN npm install -g typescript@5
WORKDIR /app

# `@clinic/types` (committed dist/) must sit at ../packages/types relative to
# api/ before `npm ci` so the `file:` specifier resolves for the typecheck.
COPY packages/types/ ./packages/types/
COPY api/package.json api/package-lock.json ./api/
WORKDIR /app/api
RUN npm ci
COPY api/ ./
RUN npm run build

# ---------------------------------------------------------------------------
# prod-deps — production-only node_modules (native module compiled here)
# ---------------------------------------------------------------------------
FROM node:24-slim AS prod-deps
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
# See the build stage — `npm ci` triggers `@clinic/types`' `prepare` (`tsc`).
RUN npm install -g typescript@5
WORKDIR /app
COPY packages/types/ ./packages/types/
COPY api/package.json api/package-lock.json ./api/
WORKDIR /app/api
RUN npm ci --omit=dev

# ---------------------------------------------------------------------------
# runtime — slim: compiled output + prod deps only, no toolchain, non-root
# ---------------------------------------------------------------------------
FROM node:24-slim AS runtime
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app/api

# The official node image ships a non-root `node` user (uid 1000). Create the
# /data mount point and hand it (and /app) to that user BEFORE the named volume
# is first mounted, so a fresh volume inherits non-root ownership and the
# entrypoint can create clinic.sqlite (+ its -wal / -shm companions).
RUN mkdir -p /data && chown -R node:node /app /data

COPY --from=prod-deps --chown=node:node /app/api/node_modules ./node_modules
COPY --from=build --chown=node:node /app/api/dist ./dist
COPY --chown=node:node api/package.json ./package.json
COPY --chown=node:node api/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER node
EXPOSE 3000

# Liveness probe against GET /health using Node's built-in fetch — no curl in
# the image, no extra dependency. start-period covers first-boot migrate+seed.
HEALTHCHECK --interval=10s --timeout=3s --retries=5 --start-period=30s \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["docker-entrypoint.sh"]
