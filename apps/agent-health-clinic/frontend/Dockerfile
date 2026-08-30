# syntax=docker/dockerfile:1
#
# Multi-stage build for the AgentClinic Next.js frontend.
# Build context is the APP ROOT (apps/agent-health-clinic/) so the
# `@clinic/types` `file:../packages/types` dependency resolves.

# ---------------------------------------------------------------------------
# build — install deps and produce a production standalone bundle
# ---------------------------------------------------------------------------
FROM node:24-slim AS build
WORKDIR /app

COPY packages/types/ ./packages/types/
COPY frontend/package.json frontend/package-lock.json ./frontend/
WORKDIR /app/frontend
RUN npm ci
COPY frontend/ ./

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so the
# API base URL is a build arg (derived from API_PORT by compose), not a runtime
# env var. Default matches the compose default API_PORT.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN npm run build

# ---------------------------------------------------------------------------
# runtime — serve the standalone production server, never `next dev`
# ---------------------------------------------------------------------------
FROM node:24-slim AS runtime
ENV NODE_ENV=production
# The Next standalone server binds via HOSTNAME/PORT env vars (not a -p flag);
# recent Next defaults HOSTNAME to localhost, unreachable from outside the
# container, so it must be 0.0.0.0.
ENV HOSTNAME=0.0.0.0
ENV PORT=3001
WORKDIR /app/frontend

RUN mkdir -p /app/frontend && chown -R node:node /app

# `outputFileTracingRoot` is the app root and the build ran in frontend/, so the
# standalone tree is rooted at .next/standalone/frontend/{server.js,node_modules}.
# `.next/static` and `public` are not traced — copy them into place by hand.
COPY --from=build --chown=node:node /app/frontend/.next/standalone/ /app/
COPY --from=build --chown=node:node /app/frontend/.next/static /app/frontend/.next/static
COPY --from=build --chown=node:node /app/frontend/public /app/frontend/public

USER node
EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=3s --retries=5 --start-period=20s \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3001)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
