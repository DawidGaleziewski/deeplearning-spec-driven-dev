import { INestApplication, ValidationPipe } from '@nestjs/common';

/**
 * Framework-level configuration applied to every AppModule instance — the real
 * server in `main.ts` and the e2e test harness alike, so tests exercise the
 * same request pipeline production does.
 *
 * CORS and the listen port stay in `main.ts`; they are process concerns, not
 * things an in-process test needs.
 */
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      // Strip unknown properties, and reject bodies that carry them, so the
      // DTOs are the single source of truth for what a request may contain.
      whitelist: true,
      forbidNonWhitelisted: true,
      // Turn plain JSON into DTO class instances (and coerce primitive types).
      transform: true,
    }),
  );
}
