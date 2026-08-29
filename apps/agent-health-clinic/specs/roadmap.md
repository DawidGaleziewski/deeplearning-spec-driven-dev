# Roadmap

High-level implementation order, in small phases. Each phase should be independently shippable/demoable.

**Cross-cutting: mobile-first responsive design.** Every UI phase below is built mobile-first and must work across mobile / tablet / desktop widths — this is not deferred to the Phase 7 polish pass. Phase 7 refines the look; it does not introduce responsiveness that earlier phases skipped. See [tech-stack.md](./tech-stack.md#responsive-design).

## Phase 1 — Core data model

In the NestJS service, define and migrate the SQLite schema (via TypeORM) for the core domain: agents, ailments, therapies, and bookings, plus their relationships (an agent has ailments, an ailment has recommended therapies, a booking links an agent to a therapy at a time). No HTTP endpoints or UI yet — verified via seed data and direct repository/unit tests.

## Phase 2 — App shells

Scaffold both services: the NestJS API (module structure, DI wiring, a health-check endpoint) and the Next.js frontend (TypeScript config, MUI + Tailwind setup, base layout, routing skeleton). The base layout is mobile-first (responsive viewport meta, a fluid container, MUI theme breakpoints configured) so every later screen inherits it. A minimal home page that round-trips through the health-check endpoint proves the two-service stack works end-to-end and renders correctly from ~375px up.

## Phase 3 — Agent & ailment management

CRUD REST endpoints on the NestJS API for agents and their ailments, surfaced through a Next.js UI. This is the first screen where the "patients" and their complaints become visible. Lists render as stacked cards on mobile and can use a denser table layout at wider breakpoints; forms are single-column and one-hand usable on a phone.

## Phase 4 — Containerization & one-command run

Dockerize both services and wire them together with Docker Compose so the whole
stack builds and runs in a single command for local testing.

- A `Dockerfile` for `api/` and one for `frontend/`, each a multi-stage build
  (install + build, then a slim runtime image). Both must handle the
  `packages/types` `file:` dependency and its committed `dist/` output.
- The frontend image builds a production Next.js bundle; the API image runs the
  compiled NestJS output, not `start:dev`.
- A root `docker-compose.yml` that builds both images, runs the API (port 3000)
  and frontend (port 3001), passes the cross-service env vars
  (`FRONTEND_ORIGIN`, `NEXT_PUBLIC_API_BASE_URL`) so the browser and CORS line
  up, and seeds/persists the SQLite database on a named volume.
- `docker compose up --build` from the repo root brings up a working stack
  reachable at <http://localhost:3001>; a documented teardown returns to a clean
  state. README updated with the containerized workflow alongside the existing
  two-terminal local flow.

No product features change in this phase — it is purely packaging and
developer/testing ergonomics.

## Phase 5 — Therapy directory

NestJS endpoints for the therapy catalog (what they treat, format, duration) — read-only from the agent-facing side, full CRUD from the dashboard. Next.js renders the browsable catalog as a responsive grid (one column on mobile, multi-column on larger screens).

## Phase 6 — Booking flow

NestJS endpoints covering the booking lifecycle (requested → confirmed → completed/cancelled); Next.js UI for agents to pick a therapy, pick a time, and confirm — a mobile-first stepped flow with touch-friendly time selection.

## Phase 7 — Staff dashboard

Next.js dashboard views, backed by NestJS admin endpoints, for human staff to view and manage agents, ailments, therapies, and the booking queue in one place. Data-dense tables get a horizontal-scroll container or collapse to a card layout on small screens; navigation collapses to a drawer/hamburger on mobile.

## Phase 8 — Visual polish

Design pass for a cohesive, attractive look across all screens (MUI theming + Tailwind spacing) — the last mile for marketing's "attractive, modern" requirement, once the functional surface area exists. Screens are already responsive by this point; this phase refines typography, spacing, and breakpoint behaviour rather than retrofitting mobile support.
