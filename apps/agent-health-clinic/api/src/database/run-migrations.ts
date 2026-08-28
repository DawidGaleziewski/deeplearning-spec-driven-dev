import { AppDataSource, DATABASE_PATH } from './data-source.js';

/** Applies all pending migrations against the configured SQLite file. */
async function run(): Promise<void> {
  await AppDataSource.initialize();
  const applied = await AppDataSource.runMigrations();
  if (applied.length === 0) {
    console.log(`No pending migrations (${DATABASE_PATH}).`);
  } else {
    console.log(
      `Applied ${applied.length} migration(s) to ${DATABASE_PATH}: ${applied
        .map((m) => m.name)
        .join(', ')}`,
    );
  }
  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
