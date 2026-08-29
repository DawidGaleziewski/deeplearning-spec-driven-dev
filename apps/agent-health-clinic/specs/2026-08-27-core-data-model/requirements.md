# Requirements — Core Data Model

## Context

This is Phase 1 of the [roadmap](../roadmap.md): the foundation every later phase (app shells, CRUD endpoints, booking flow, dashboard) builds on. Per [mission.md](../mission.md), the domain is a health clinic where the patients are AI agents and the ailments are caused by their humans. The real HTTP API and Next.js UI arrive in Phase 2+; this phase is data-layer first, inside the NestJS service, using SQLite via TypeORM per [tech-stack.md](../tech-stack.md).

**Amendment (2026-08-28):** In addition to the repository/unit-test validation, this phase now also ships a **minimal, throwaway test UI** — a single unstyled-ish HTML form served by the NestJS service — so the data model can be exercised by hand in a browser. This is a testing aid only: it is not the Phase 2+ Next.js/MUI/Tailwind frontend and is expected to be deleted or replaced when the real API and UI land.

## Scope

In scope:
- TypeORM entities for the four core domain objects: **Agent**, **Ailment**, **Therapy**, **Booking**.
- Relationships between them:
  - An Agent has many Ailments (an agent can present with multiple complaints).
  - An Ailment has many recommended Therapies (many-to-many — a therapy can treat multiple ailments, an ailment can have multiple recommended therapies).
  - A Booking links one Agent to one Therapy at a specific time.
- TypeORM migrations to create the SQLite schema from these entities.
- A seed script that populates representative rows across all four entities and their relationships.
- Repository-level unit tests (Vitest, per [tech-stack.md](../tech-stack.md)) exercising CRUD and relationship queries for each entity.
- **A minimal test HTTP surface** inside the NestJS service, just enough to drive the test UI:
  - `POST` (create) and `GET` (list) for each of Agent, Ailment, Therapy, Booking.
  - Endpoints to link an Ailment to an Agent and to link recommended Therapies to an Ailment.
  - JSON in/out, no DTO validation library, no pagination, no auth — thin passthroughs to the repositories.
- **A minimal test UI**: one HTML page served by the NestJS service (e.g. from `public/` via static file serving, or a single controller returning HTML) containing:
  - A plain `<form>` per entity to create a row, and a section listing existing rows.
  - Controls to attach an ailment to an agent and to attach therapies to an ailment.
  - Vanilla JS `fetch` against the endpoints above — no build step, no framework.
  - Basic styling only: a small inline `<style>` block (readable spacing, form layout). No MUI, no Tailwind, no design pass.

Out of scope (later phases):
- The real HTTP/REST API design — resource modelling, DTOs, validation, error contracts, versioning (Phase 3+). The endpoints here are deliberately crude and disposable.
- Any Next.js / MUI / Tailwind frontend work, routing, or layout (Phase 2+).
- Visual design, branding, responsive behaviour, or copy for the test UI. The mobile-first responsive requirement in [tech-stack.md](../tech-stack.md#responsive-design) applies to the real Phase 2+ Next.js frontend, **not** to this disposable single-page `/dev` test aid — it only needs to be usable on a desktop browser. Responsiveness is a validation item starting with the Phase 2 app shell.
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
- **Primary validation stays at the repository level**: the seed data + repository/unit tests (Vitest) remain the source of truth for correctness, per the roadmap's note ("verified via seed data and direct repository/unit tests"). The test UI is a convenience for manual exploration, not a substitute — it is not required to have automated test coverage.
- **Vitest as the test runner**: unit/repository tests via `npm test` (`vitest run`); the `/dev` endpoints are additionally driven by an e2e spec via `npm run test:e2e` (`vitest.config.e2e.ts`). Per [tech-stack.md](../tech-stack.md).
- **Test UI/endpoints live in a clearly disposable place**: a single `dev`/`playground` module (e.g. `DevModule`) and a `public/` HTML file, so the whole thing can be removed in one commit when Phase 2/3 replace it. It should be trivially disable-able (e.g. only registered when `NODE_ENV !== 'production'` or behind an env flag).
- **No new heavy dependencies**: static file serving via `@nestjs/serve-static` (or a hand-rolled controller) is acceptable; no frontend toolchain, bundler, or component library is added in this phase.

## Open questions

None blocking — field lists are intentionally minimal and can be extended in later phases without breaking this schema's shape. The test endpoints/UI are explicitly throwaway, so their shape does not need to be "right".
