# Validation — Core Data Model

This phase is done when all of the following hold. Primary validation is at the schema/repository level, per the roadmap. Per the 2026-08-28 amendment, a minimal throwaway test UI also ships and has its own checks below.

## Schema & migrations

- [x] `Agent`, `Ailment`, `Therapy`, `Booking` entities exist as TypeORM entities in the NestJS service. — `api/src/entities/`
- [x] Relationships match the roadmap: Agent → many Ailments; Ailment ↔ Therapy many-to-many; Booking → one Agent + one Therapy.
- [x] Running the migrations against an empty SQLite file produces the full schema with no manual steps. — `npm run migration:run`; also reversible via `npm run migration:revert`.
- [x] The NestJS app boots successfully with all entity modules registered (no DI/wiring errors). — covered by `test/app.e2e-spec.ts`.

## Seed data

- [x] The seed script runs against a freshly migrated database without errors. — `npm run seed` (and `npm run db:reset`).
- [x] After seeding, the database contains: multiple agents (3), ailments linked to those agents, therapies (3), ailments linked to multiple therapies and therapies recommended for multiple ailments (e.g. "Boundary Setting" → 2 ailments), and bookings linking an agent and a therapy with valid statuses (2).
- [x] Spot-checking the seeded rows confirms relationships resolve correctly (agent → ailments, ailment → recommended therapies, booking → agent/therapy).

## Repository/unit tests

- [x] Repository-level tests exist for all four entities covering create, read, update, delete. — `api/src/**/*.repository.spec.ts`.
- [x] Relationship queries are tested: agent→ailments, ailment→therapies (and reverse), booking→agent/therapy; plus many-to-many link/unlink and FK cascade / set-null behaviour.
- [x] Booking status only accepts the four defined values (`requested | confirmed | completed | cancelled`); an invalid value is rejected at the DB level (CHECK constraint).
- [x] Full test suite passes locally — `npm test` (18 tests) and `npm run test:e2e` (4 tests).
- [x] Tests run against an isolated test database (fresh in-memory SQLite per test), not the shared `data/dev.sqlite`.

## Minimal test UI (amendment — 2026-08-28)

- [x] Starting the NestJS service and opening `http://localhost:3000/dev` serves a single HTML page with a create form and a list view for each of Agent, Ailment, Therapy, Booking. (Root `/` still returns the health-check string.)
- [x] From the page, a new row of each entity can be created and then appears in that entity's list.
- [x] The page can attach an ailment to an agent, and the agent's list view then shows that ailment.
- [x] The page can attach multiple recommended therapies to an ailment, and the ailment's list view then shows them (and a therapy's list view shows the ailments it's recommended for).
- [x] A booking can be created linking an existing agent and therapy with a valid status, and it appears in the booking list with both relations resolved.
- [x] The test module/endpoints and `public/` page are isolated (single `DevModule` + `src/dev/` + one HTML file) and are not registered when `NODE_ENV=production` (unless `ENABLE_DEV_UI=true`).
- [x] Styling is limited to one inline `<style>` block; no MUI, Tailwind, bundler, or frontend framework was added to the service.

## Ready to merge when

- [x] All checkboxes above are checked.
- [x] The only HTTP surface added is the disposable `/dev/*` test API; no Next.js frontend, no production API design was introduced (per requirements.md).
- [x] The plan.md task groups are all complete.
