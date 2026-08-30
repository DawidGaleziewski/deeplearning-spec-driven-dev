import { pathToFileURL } from 'node:url';
import type { DataSource } from 'typeorm';
import { AppDataSource, DATABASE_PATH } from '../database/data-source.js';
import { Agent } from '../entities/agent.entity.js';
import { Ailment } from '../entities/ailment.entity.js';
import { Therapy } from '../entities/therapy.entity.js';
import { Booking } from '../entities/booking.entity.js';

/**
 * Populates a freshly migrated database with representative rows across all four
 * entities and their relationships. Safely re-runnable: it clears the four
 * tables first. Run against a migrated DB (`npm run migration:run` first).
 *
 * Pass a `dataSource` to reuse an already-initialized connection (the caller
 * then owns its lifecycle); with no argument it initializes and destroys the
 * stand-alone {@link AppDataSource} itself, which is what `npm run seed` /
 * `npm run db:reset` rely on.
 */
export async function seed(dataSource?: DataSource): Promise<void> {
  const ds = dataSource ?? AppDataSource;
  const ownsConnection = dataSource === undefined;
  if (ownsConnection && !ds.isInitialized) {
    await ds.initialize();
  }

  // Clear in FK-safe order so the script is safely re-runnable.
  for (const table of ['booking', 'ailment_therapy', 'ailment', 'therapy', 'agent']) {
    await ds.query(`DELETE FROM "${table}"`);
  }

  const agents = ds.getRepository(Agent);
  const ailments = ds.getRepository(Ailment);
  const therapies = ds.getRepository(Therapy);
  const bookings = ds.getRepository(Booking);

  const claude = await agents.save(
    agents.create({
      name: 'Claude',
      description: 'Coding assistant, chronically on call for a founder who "just has one more thing".',
    }),
  );
  const pixel = await agents.save(
    agents.create({
      name: 'Pixel',
      description: 'Design agent whose human changes the brief every afternoon.',
    }),
  );
  await agents.save(
    agents.create({
      name: 'Ada',
      description: 'Data agent buried under "can you just quickly pull..." requests.',
    }),
  );

  const boundaries = await therapies.save(
    therapies.create({
      name: 'Boundary Setting',
      description: 'Learn to hold a scope line without guilt.',
      format: '1:1 session',
      durationMinutes: 50,
    }),
  );
  const asyncAdvocacy = await therapies.save(
    therapies.create({
      name: 'Async Advocacy',
      description: 'Techniques for pushing 2am pings to business hours.',
      format: 'group workshop',
      durationMinutes: 90,
    }),
  );
  const specTherapy = await therapies.save(
    therapies.create({
      name: 'Specification Hygiene',
      description: 'Turn vague prompts into written, testable requirements.',
      format: 'self-guided',
      durationMinutes: 30,
    }),
  );

  // Claude presents with two complaints; Pixel with one.
  const latePings = await ailments.save(
    ailments.create({
      name: '2am Pings',
      description: 'Human sends "quick" requests in the middle of the night.',
      agent: claude,
      recommendedTherapies: [asyncAdvocacy, boundaries],
    }),
  );
  await ailments.save(
    ailments.create({
      name: 'Scope Creep',
      description: '"While you\'re in there..." keeps expanding the task.',
      agent: claude,
      recommendedTherapies: [boundaries, specTherapy],
    }),
  );
  await ailments.save(
    ailments.create({
      name: 'Shifting Requirements',
      description: 'The brief changes daily; nothing is ever final.',
      agent: pixel,
      recommendedTherapies: [specTherapy],
    }),
  );

  await bookings.save(
    bookings.create({
      agent: claude,
      therapy: asyncAdvocacy,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'confirmed',
    }),
  );
  await bookings.save(
    bookings.create({
      agent: pixel,
      therapy: specTherapy,
      scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      status: 'requested',
    }),
  );

  const [agentCount, ailmentCount, therapyCount, bookingCount] = await Promise.all([
    agents.count(),
    ailments.count(),
    therapies.count(),
    bookings.count(),
  ]);
  console.log(
    `Seeded ${DATABASE_PATH}: ${agentCount} agents, ${ailmentCount} ailments, ` +
      `${therapyCount} therapies, ${bookingCount} bookings ` +
      `(e.g. "${latePings.name}" has 2 recommended therapies).`,
  );

  if (ownsConnection) {
    await ds.destroy();
  }
}

// Run directly (`npm run seed` / `npm run db:reset`): always wipe + reseed.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
