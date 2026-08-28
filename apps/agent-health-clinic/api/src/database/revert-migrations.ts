import { AppDataSource, DATABASE_PATH } from './data-source.js';

/** Reverts the most recently applied migration. */
async function revert(): Promise<void> {
  await AppDataSource.initialize();
  await AppDataSource.undoLastMigration();
  console.log(`Reverted last migration on ${DATABASE_PATH}.`);
  await AppDataSource.destroy();
}

revert().catch((err) => {
  console.error(err);
  process.exit(1);
});
