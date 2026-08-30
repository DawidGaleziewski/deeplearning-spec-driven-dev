#!/bin/sh
# Container entrypoint for the AgentClinic API.
#
# The running Nest app does NOT apply migrations (DatabaseModule has no
# `migrationsRun`), so schema readiness depends entirely on this script running
# them before the API process starts. Order matters:
#   1. migrate  — idempotent, no-ops when nothing is pending
#   2. seed     — only if the database is empty (see seed-if-empty.ts)
#   3. exec API — replaces the shell so signals reach node directly
set -e

echo "[entrypoint] applying migrations against ${DATABASE_PATH:-data/dev.sqlite}"
node dist/database/run-migrations.js

echo "[entrypoint] seeding if the database is empty"
node dist/seed/seed-if-empty.js

echo "[entrypoint] starting API on port ${PORT:-3000}"
exec node dist/main.js
