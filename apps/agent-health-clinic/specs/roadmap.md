# Roadmap

High-level implementation order, in small phases. Each phase should be independently shippable/demoable.

## Phase 1 — Core data model

In the NestJS service, define and migrate the SQLite schema (via TypeORM) for the core domain: agents, ailments, therapies, and bookings, plus their relationships (an agent has ailments, an ailment has recommended therapies, a booking links an agent to a therapy at a time). No HTTP endpoints or UI yet — verified via seed data and direct repository/unit tests.

## Phase 2 — App shells

Scaffold both services: the NestJS API (module structure, DI wiring, a health-check endpoint) and the Next.js frontend (TypeScript config, MUI + Tailwind setup, base layout, routing skeleton). A minimal home page that round-trips through the health-check endpoint proves the two-service stack works end-to-end.

## Phase 3 — Agent & ailment management

CRUD REST endpoints on the NestJS API for agents and their ailments, surfaced through a Next.js UI. This is the first screen where the "patients" and their complaints become visible.

## Phase 4 — Therapy directory

NestJS endpoints for the therapy catalog (what they treat, format, duration) — read-only from the agent-facing side, full CRUD from the dashboard. Next.js renders the browsable catalog.

## Phase 5 — Booking flow

NestJS endpoints covering the booking lifecycle (requested → confirmed → completed/cancelled); Next.js UI for agents to pick a therapy, pick a time, and confirm.

## Phase 6 — Staff dashboard

Next.js dashboard views, backed by NestJS admin endpoints, for human staff to view and manage agents, ailments, therapies, and the booking queue in one place.

## Phase 7 — Visual polish

Design pass for a cohesive, attractive look across all screens (MUI theming + Tailwind spacing) — the last mile for marketing's "attractive, modern" requirement, once the functional surface area exists.
