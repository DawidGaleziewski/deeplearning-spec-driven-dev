# Changelog

All notable changes to **agent-health-clinic** are recorded here, newest date first.
Update it via the `changelog` skill before merging a branch.

## 2026-08-28

- Implemented the Phase 1 core data model in the NestJS API: `Agent`, `Ailment`, `Therapy`, and `Booking` entities with their relationships, plus a `BookingStatus` type.
- Added the initial TypeORM migration (`InitialSchema`) and migration runner / revert scripts, backed by a dedicated data source.
- Added repository unit tests for agents, ailments, therapies, and bookings, with a separate test data source.
- Added a seed script and a `/dev` controller/module for populating and inspecting local data.
- Added a static API landing page and expanded the e2e test suite.
- Expanded the core-data-model spec (requirements, plan, validation).

## 2026-08-27

- Scaffolded the NestJS API service: module structure, SQLite + TypeORM wiring, health-check controller, Vitest unit and e2e config.
- Added the first feature spec set under `specs/2026-08-27-core-data-model/` (requirements, plan, validation).

## 2026-08-26

- Seeded the project constitution: `specs/mission.md`, `specs/roadmap.md`, `specs/tech-stack.md`, and the app README.
