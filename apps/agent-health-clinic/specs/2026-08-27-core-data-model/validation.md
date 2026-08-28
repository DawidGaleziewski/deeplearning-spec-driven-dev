# Validation — Core Data Model

This phase is done when all of the following hold. Primary validation is at the schema/repository level, per the roadmap. Per the 2026-08-28 amendment, a minimal throwaway test UI also ships and has its own (manual) checks below.

## Schema & migrations

- [ ] `Agent`, `Ailment`, `Therapy`, `Booking` entities exist as TypeORM entities in the NestJS service.
- [ ] Relationships match the roadmap: Agent → many Ailments; Ailment ↔ Therapy many-to-many; Booking → one Agent + one Therapy.
- [ ] Running the migrations against an empty SQLite file produces the full schema with no manual steps.
- [ ] The NestJS app boots successfully with all entity modules registered (no DI/wiring errors).

## Seed data

- [ ] The seed script runs against a freshly migrated database without errors.
- [ ] After seeding, the database contains: multiple agents, ailments linked to those agents, therapies, at least one ailment linked to multiple therapies (and vice versa), and at least one booking linking an agent and a therapy with a valid status.
- [ ] Spot-checking the seeded rows (e.g. via a SQLite browser or a small query script) confirms relationships resolve correctly (e.g. loading an agent returns its ailments; loading an ailment returns its recommended therapies).

## Repository/unit tests

- [ ] Repository-level tests exist for all four entities covering create, read, update, delete.
- [ ] Relationship queries are tested: agent→ailments, ailment→therapies (and reverse), booking→agent/therapy.
- [ ] Booking status only accepts the four defined values (`requested | confirmed | completed | cancelled`); an invalid value is rejected.
- [ ] Full test suite passes locally (`npm test` or equivalent in the NestJS service).
- [ ] Tests run against an isolated test database (temp/in-memory SQLite), not a shared dev database.

## Minimal test UI (amendment — 2026-08-28)

- [ ] Starting the NestJS service and opening `http://localhost:3000/` serves a single HTML page with a create form and a list view for each of Agent, Ailment, Therapy, Booking.
- [ ] From the page, a new row of each entity can be created and then appears in that entity's list.
- [ ] The page can attach an ailment to an agent, and the agent's list view then shows that ailment.
- [ ] The page can attach multiple recommended therapies to an ailment, and the ailment's list view then shows them (and a therapy's list view shows the ailments it's recommended for).
- [ ] A booking can be created linking an existing agent and therapy with a valid status, and it appears in the booking list with both relations resolved.
- [ ] The test module/endpoints and `public/` page are isolated (single `DevModule` + one HTML file) and are not registered when `NODE_ENV=production` (or the dev flag is off).
- [ ] Styling is limited to one inline `<style>` block; no MUI, Tailwind, bundler, or frontend framework was added to the service.

## Ready to merge when

- [ ] All checkboxes above are checked.
- [ ] The only HTTP surface added is the disposable `/dev/*` test API; no Next.js frontend, no production API design was introduced (per requirements.md).
- [ ] The plan.md task groups are all complete.
