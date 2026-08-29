/**
 * `@clinic/types` — the HTTP contract shared by the NestJS API and the Next.js
 * frontend. Types only: no runtime code, no `class-validator` decorators, no
 * dependency on TypeORM or Nest. The API's DTO classes `implement` the request
 * types below; the frontend's `src/lib/api.ts` consumes the response types.
 *
 * Introduced in Phase 3 (agent & ailment management). Later phases add the
 * therapy, booking, and dashboard shapes here.
 */
export {};
