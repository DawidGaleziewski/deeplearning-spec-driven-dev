import { AppDataSource, DATABASE_PATH } from '../database/data-source.js';
import { seed } from './seed.js';

/**
 * Container entrypoint helper: seed the database **only when it is empty**.
 *
 * The Docker entrypoint runs migrations on every start (idempotent) and then
 * this script. On a fresh named volume the DB has no rows, so it gets the demo
 * seed data; on every restart afterwards it is a no-op, so agents/ailments
 * created through the UI survive `docker compose down` + `up`. A deliberate
 * `docker compose down -v` drops the volume and the next `up` re-seeds.
 *
 * The always-wipe-and-reseed behaviour still lives in `seed.ts` for local use
 * (`npm run seed`, `npm run db:reset`).
 */
async function seedIfEmpty(): Promise<void> {
  await AppDataSource.initialize();
  try {
    let count = 0;
    try {
      const rows = await AppDataSource.query('SELECT COUNT(*) AS count FROM "agent"');
      count = Number(rows?.[0]?.count ?? 0);
    } catch {
      // Table missing (schema not migrated yet) — treat as empty.
      count = 0;
    }

    if (count > 0) {
      console.log(`Seed skipped: ${DATABASE_PATH} already has ${count} agent(s).`);
      return;
    }

    console.log(`Seeding: ${DATABASE_PATH} is empty.`);
    await seed(AppDataSource);
  } finally {
    await AppDataSource.destroy();
  }
}

seedIfEmpty().catch((err) => {
  console.error(err);
  process.exit(1);
});
