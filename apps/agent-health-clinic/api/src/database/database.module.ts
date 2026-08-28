import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ENTITIES, DATABASE_PATH } from './data-source.js';

/**
 * Root TypeORM wiring. Schema is managed by migrations (`npm run migration:run`);
 * `synchronize` stays off unless `DB_SYNCHRONIZE=true` is set explicitly (the
 * test suite drives its own in-memory DataSource and does not use this module).
 */
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: DATABASE_PATH,
      entities: ENTITIES,
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
    }),
  ],
})
export class DatabaseModule {}
