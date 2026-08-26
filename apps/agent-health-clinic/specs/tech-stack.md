# Tech Stack

## Language

TypeScript end-to-end (server, API, and UI) — satisfies engineering's ask for a popular, reliable, typed stack.

## Framework

**Next.js**, as the frontend only — server/client React components rendering the public site and the staff/agent dashboard. Backend logic lives in a separate NestJS service (see Backend below); the two are deployed independently and communicate over HTTP.

## Backend

**NestJS**, as a standalone API service, separate from the Next.js frontend, communicating over HTTP (REST vs. GraphQL TBD at implementation time). Chosen for our growing needs — keeps app architecture clean and structured as the domain grows. Follow Nest's opinionated conventions (modules, providers, dependency injection) rather than working around them.

## Database

**SQLite** — zero-setup, file-based, no server to run or host. Right-sized for a course/demo project; avoids the operational overhead of Postgres while still being a real relational database.

## Data access

**TypeORM** — the ORM NestJS's own docs and conventions are built around; its decorator-based entities fit naturally with Nest's module/DI style, more so than alternatives like Prisma.

## UI

Standard Next.js. **Material UI** as the component library; **Tailwind CSS** for spacing/layout utilities (padding, positioning, flex containers). Since both ship a CSS reset, disable Tailwind's `preflight` to avoid it fighting MUI's `CssBaseline`.

## Browser support

Modern evergreen browsers only (current Chrome/Firefox/Safari/Edge) — no legacy/IE support needed, per marketing's ask for an attractive, modern-browser site.
