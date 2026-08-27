# Validation — Core Data Model

This phase is done when all of the following hold. No HTTP endpoints or UI are in scope, so validation is entirely at the schema/repository level, per the roadmap.

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

## Ready to merge when

- [ ] All checkboxes above are checked.
- [ ] No HTTP endpoints or Next.js changes were introduced (scope stayed data-layer only, per requirements.md).
- [ ] The plan.md task groups are all complete.
