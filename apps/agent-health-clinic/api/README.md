<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

This links the local `@clinic/types` package (`../packages/types`, the shared
HTTP contract) via a `file:` dependency. Its build output is committed, so a
plain `npm install` is enough; if you change `packages/types/src`, run
`npm run build` in that directory.

## Running

```bash
$ npm run start:dev      # watch mode, listens on $PORT (default 3000)
```

The frontend (`../frontend/`) is a separate process on port 3001 — start both.

### Environment variables

| Variable          | Default                  | Purpose                                                          |
| ----------------- | ------------------------ | --------------------------------------------------------------- |
| `PORT`            | `3000`                   | HTTP listen port (`main.ts`).                                   |
| `FRONTEND_ORIGIN` | `http://localhost:3001`  | Allowed CORS origin for browser calls from the Next.js app.    |
| `DATABASE_PATH`   | `data/dev.sqlite`        | SQLite file (`:memory:` in tests).                             |
| `DB_SYNCHRONIZE`  | `false`                  | TypeORM auto-schema; migrations are the real path.            |
| `ENABLE_DEV_UI`   | unset                    | Force-register the throwaway `/dev` UI (also on when `NODE_ENV !== 'production'`). |

## HTTP surface & module tree

`AppModule` composes the feature modules; each owns one slice of the domain and
nothing reaches across another module's entities directly (the one sanctioned
exception: `AilmentsModule` holds a read-only `Agent` repository handle to
resolve an ailment's `agentId`).

| Module            | Owns                                   | Routes                        |
| ----------------- | -------------------------------------- | ----------------------------- |
| `AppModule`       | composition root                       | `GET /` (hello string)        |
| `HealthModule`    | liveness probe, **no DB access**       | `GET /health` → `{ status: 'ok', uptime, timestamp }` |
| `DatabaseModule`  | root TypeORM connection                | —                             |
| `AgentsModule`    | `Agent` entity + REST surface          | `GET/POST /agents`, `GET/PATCH/DELETE /agents/:id`, `POST /agents/:id/ailments` |
| `AilmentsModule`  | `Ailment` entity + REST surface        | `GET/POST /ailments`, `GET/PATCH/DELETE /ailments/:id` |
| `TherapiesModule` | `Therapy` entity + repository          | — (catalog endpoints land in Phase 4) |
| `BookingsModule`  | `Booking` entity + repository          | — (Phase 5)                   |
| `DevModule`       | throwaway Phase 1 manual-test UI       | `GET/POST /dev/*` (dev only)   |

`GET /health` is a **liveness** check — it never queries the database, so it
stays green even when the DB is unavailable. Readiness reporting can move to
`@nestjs/terminus` later when there are dependencies worth surfacing.

### Agents & ailments API (Phase 3)

Request bodies are validated by a global `ValidationPipe` (`whitelist` +
`forbidNonWhitelisted` + `transform`, wired in `src/app-config.ts` and shared
with the e2e harness). Unknown fields or a missing/blank `name` → `400`;
unknown `:id` or `agentId` → `404`. `:id` path params must be UUIDs.

Response shapes are the `*Response` types from **`@clinic/types`** (dates as
ISO strings, relations trimmed to summaries by `src/common/serialization.ts`).

| Method & path                | Body                                   | Returns |
| ---------------------------- | -------------------------------------- | ------- |
| `POST /agents`               | `{ name, description? }`               | `201` `AgentResponse` |
| `GET /agents`                | —                                      | `AgentResponse[]`, oldest-first, each with its `ailments` |
| `GET /agents/:id`            | —                                      | `AgentResponse` (ailments + their `recommendedTherapies`) |
| `PATCH /agents/:id`          | `{ name?, description? }`              | updated `AgentResponse` |
| `DELETE /agents/:id`         | —                                      | `204`; the agent's ailments are kept, `agent` set to `null` |
| `POST /agents/:id/ailments`  | `{ name, description? }`               | `201` `AilmentResponse` attached to the agent — the check-in "add complaint" action |
| `POST /ailments`             | `{ name, description?, agentId? }`     | `201` `AilmentResponse` |
| `GET /ailments`              | —                                      | `AilmentResponse[]`, oldest-first, with `agent` + `recommendedTherapies` |
| `GET /ailments/:id`          | —                                      | `AilmentResponse` |
| `PATCH /ailments/:id`        | `{ name?, description?, agentId? }`    | updated; send `agentId: null` to detach |
| `DELETE /ailments/:id`       | —                                      | `204` |

Recommended therapies on an ailment are **read-only** this phase (surfaced from
seed data); the editable link is Phase 4.

## Database (Phase 1 — core data model)

SQLite via TypeORM. Entities: `Agent`, `Ailment`, `Therapy`, `Booking` (see
`src/entities/`). Relationships: an agent has many ailments; an ailment has many
recommended therapies (many-to-many); a booking links one agent to one therapy.

```bash
# create the schema in data/dev.sqlite from the migration
$ npm run migration:run

# populate representative rows (safe to re-run)
$ npm run seed

# revert the last migration
$ npm run migration:revert

# nuke + recreate + reseed data/dev.sqlite
$ npm run db:reset
```

The test suite (`npm test`) does not use `data/dev.sqlite` — each repository test
spins up its own isolated in-memory SQLite database.

## Test UI (throwaway — Phase 1 only)

A minimal HTML form for exercising the data model by hand. **Not** the Phase 2+
Next.js frontend; delete `src/dev/` and `public/index.html` when the real API
lands. Registered only when `NODE_ENV !== 'production'` (or `ENABLE_DEV_UI=true`).

```bash
$ npm run db:reset        # first time, so there is data to see
$ npm run start:dev
# open http://localhost:3000/dev
```

It talks to `POST`/`GET /dev/{agents,ailments,therapies,bookings}` plus
`POST /dev/agents/:id/ailments` and `POST /dev/ailments/:id/therapies`.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observer](https://observer.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
