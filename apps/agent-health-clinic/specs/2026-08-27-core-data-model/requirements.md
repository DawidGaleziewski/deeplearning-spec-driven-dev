# Requirements — Core Data Model

## Context

This is Phase 1 of the [roadmap](../roadmap.md): the foundation every later phase (app shells, CRUD endpoints, booking flow, dashboard) builds on. Per [mission.md](../mission.md), the domain is a health clinic where the patients are AI agents and the ailments are caused by their humans. No HTTP endpoints or UI exist yet (Phase 2+); this phase is data-layer only, inside the NestJS service, using SQLite via TypeORM per [tech-stack.md](../tech-stack.md).

## Scope

In scope:
- TypeORM entities for the four core domain objects: **Agent**, **Ailment**, **Therapy**, **Booking**.
- Relationships between them:
  - An Agent has many Ailments (an agent can present with multiple complaints).
  - An Ailment has many recommended Therapies (many-to-many — a therapy can treat multiple ailments, an ailment can have multiple recommended therapies).
  - A Booking links one Agent to one Therapy at a specific time.
- TypeORM migrations to create the SQLite schema from these entities.
- A seed script that populates representative rows across all four entities and their relationships.
- Repository-level unit tests exercising CRUD and relationship queries for each entity.

Out of scope (later phases):
- HTTP/REST endpoints (Phase 3+).
- Any Next.js/UI work (Phase 2+).
- Booking lifecycle state transitions/business logic beyond storing a status field (Phase 5 owns the lifecycle behavior; this phase just needs the status to be representable in the schema).
- Auth, staff dashboard, visual design (Phases 6-7).

## Decisions

- **Minimal fields**: fields are whatever's needed to make the entities and relationships real and testable — no speculative columns. Reasonable baseline per entity:
  - `Agent`: id, name, and enough identifying info to be a believable "patient" (e.g. a short description).
  - `Ailment`: id, name, description.
  - `Therapy`: id, name, description, format, duration — per Phase 4's mention of "what they treat, format, duration" (format/duration can be simple typed fields now even though the therapy directory UI comes later).
  - `Booking`: id, agent (FK), therapy (FK), scheduled time, status.
- **Booking status enum**: `requested | confirmed | completed | cancelled`, matching Phase 5's stated lifecycle, even though transition logic isn't implemented until Phase 5. The column exists now so the schema doesn't need to change shape later.
- **Ailment ↔ Therapy is many-to-many**: the roadmap says "an ailment has recommended therapies" (plural); a therapy realistically treats more than one ailment, so a join table is used rather than a one-to-many.
- **No HTTP/UI validation**: correctness is verified at the repository/entity level only, per the roadmap's explicit note ("verified via seed data and direct repository/unit tests").

## Open questions

None blocking — field lists are intentionally minimal and can be extended in later phases without breaking this schema's shape.
