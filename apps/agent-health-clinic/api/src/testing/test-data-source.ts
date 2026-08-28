import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ENTITIES } from '../database/data-source.js';

/**
 * Creates an isolated in-memory SQLite DataSource for repository tests. Each
 * call gets its own fresh database (`synchronize` builds the schema); callers
 * must `destroy()` it in `afterEach`/`afterAll`.
 */
export async function createTestDataSource(): Promise<DataSource> {
  const ds = new DataSource({
    type: 'better-sqlite3',
    database: ':memory:',
    entities: ENTITIES,
    synchronize: true,
    dropSchema: true,
  });
  await ds.initialize();
  return ds;
}
