import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Agent } from '../entities/agent.entity.js';
import { Ailment } from '../entities/ailment.entity.js';
import { Therapy } from '../entities/therapy.entity.js';
import { Booking } from '../entities/booking.entity.js';
import { InitialSchema1756000000000 } from '../migrations/1756000000000-InitialSchema.js';

export const ENTITIES = [Agent, Ailment, Therapy, Booking];

export const DATABASE_PATH = process.env.DATABASE_PATH ?? 'data/dev.sqlite';

/**
 * Stand-alone DataSource used by the migration scripts (`npm run migration:*`)
 * and the seed script. The running Nest app configures TypeORM separately in
 * `DatabaseModule`.
 */
export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: DATABASE_PATH,
  entities: ENTITIES,
  migrations: [InitialSchema1756000000000],
  synchronize: false,
});
