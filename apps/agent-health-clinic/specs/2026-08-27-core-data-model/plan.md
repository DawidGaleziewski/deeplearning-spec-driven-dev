# Plan — Core Data Model

## 1. NestJS service scaffold (minimal, data-layer only)

1.1. Initialize the NestJS project inside the appropriate service directory (per tech-stack.md, a standalone service separate from Next.js).
1.2. Add TypeORM + SQLite dependencies and wire up `TypeOrmModule` with a file-based SQLite connection.
1.3. Confirm the app boots with no entities yet (empty module tree compiles and starts).

## 2. Entities

2.1. `Agent` entity: id, name, description, timestamps.
2.2. `Ailment` entity: id, name, description, timestamps; `ManyToOne`/`OneToMany` relation to `Agent`.
2.3. `Therapy` entity: id, name, description, format, duration, timestamps.
2.4. Many-to-many join between `Ailment` and `Therapy` (recommended therapies per ailment).
2.5. `Booking` entity: id, scheduled time, status enum (`requested | confirmed | completed | cancelled`), timestamps; `ManyToOne` relations to `Agent` and `Therapy`.
2.6. Register all entities in their respective TypeORM feature modules.

## 3. Migrations

3.1. Generate an initial TypeORM migration from the entity set.
3.2. Verify the migration runs clean against a fresh SQLite file (create schema from nothing).
3.3. Verify the migration is reversible (`down` drops cleanly) or document why not, if TypeORM/SQLite limitations make full reversibility impractical.

## 4. Seed script

4.1. Write a seed script (e.g. a NestJS CLI command or standalone script using the same TypeORM connection) that inserts a handful of representative rows: a few agents, ailments attached to agents, therapies, ailment↔therapy links, and bookings tying agents to therapies.
4.2. Make the seed script idempotent or safely re-runnable against a clean DB (document the expected usage, e.g. "run against a freshly migrated DB").

## 5. Repository-level tests

5.1. Set up a test database strategy (e.g. in-memory/temp SQLite file per test run) so tests don't touch dev data.
5.2. Unit tests for `Agent` repository: create, read, update, delete; fetch with its ailments.
5.3. Unit tests for `Ailment` repository: CRUD; fetch with recommended therapies; verify many-to-many linking/unlinking.
5.4. Unit tests for `Therapy` repository: CRUD; fetch ailments it's recommended for.
5.5. Unit tests for `Booking` repository: CRUD; verify FK relations to `Agent` and `Therapy` resolve correctly; verify status enum values are enforced/stored correctly.

## 6. Minimal test surface (amendment — 2026-08-28)

Disposable manual-testing aid. Not the Phase 2+ API/UI. Keep it isolated so it can be deleted in one commit.

6.1. Create a `DevModule` (e.g. `src/dev/`) registered in `AppModule` only when not in production (`NODE_ENV !== 'production'` or an `ENABLE_DEV_UI` flag).
6.2. Add thin controllers under `DevModule` with, per entity (Agent, Ailment, Therapy, Booking): `POST /dev/<entity>` (create from JSON body) and `GET /dev/<entity>` (list all, with relations loaded). Delegate straight to the TypeORM repositories — no DTO/validation layer.
6.3. Add link endpoints: `POST /dev/agents/:id/ailments` (attach an ailment to an agent) and `POST /dev/ailments/:id/therapies` (attach recommended therapies to an ailment).
6.4. Serve one static HTML page (`public/index.html`) — via `@nestjs/serve-static` or a controller returning the file — with: a create `<form>` + a list view per entity, plus the two link controls. Vanilla JS `fetch`, no build step.
6.5. Add a small inline `<style>` block: basic form/spacing/table layout only. No component library, no design work.
6.6. Note in `api/README.md` how to start the service and open the test UI (`npm run start:dev`, then `http://localhost:3000/`).

## 7. Wrap-up

7.1. Run the full test suite and confirm all repository tests pass.
7.2. Run the seed script against a clean migrated DB and manually spot-check the resulting rows (e.g. via a SQLite browser or a quick query script).
7.3. Start the service, open the test UI, and manually exercise: create one of each entity, attach an ailment to an agent, attach two therapies to an ailment, create a booking — confirm the list views reflect the relationships.
7.4. Update this feature's validation.md checklist as items are confirmed, then move to review/merge.
