import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 1 schema: agents, ailments, therapies, bookings and the ailment↔therapy
 * join table. Hand-authored to mirror the entity metadata (TypeORM's SQLite
 * schema builder produces the same shape under `synchronize`, which the tests
 * rely on). Constraint names are readable rather than the hash names TypeORM
 * would generate.
 */
export class InitialSchema1756000000000 implements MigrationInterface {
  name = 'InitialSchema1756000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "agent" (
        "id" varchar PRIMARY KEY NOT NULL,
        "name" varchar NOT NULL,
        "description" text,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "therapy" (
        "id" varchar PRIMARY KEY NOT NULL,
        "name" varchar NOT NULL,
        "description" text,
        "format" varchar,
        "durationMinutes" integer,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "ailment" (
        "id" varchar PRIMARY KEY NOT NULL,
        "name" varchar NOT NULL,
        "description" text,
        "agentId" varchar,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_ailment_agent" FOREIGN KEY ("agentId")
          REFERENCES "agent" ("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_ailment_agent" ON "ailment" ("agentId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "booking" (
        "id" varchar PRIMARY KEY NOT NULL,
        "scheduledAt" datetime NOT NULL,
        "status" varchar NOT NULL DEFAULT ('requested')
          CHECK ("status" IN ('requested','confirmed','completed','cancelled')),
        "agentId" varchar NOT NULL,
        "therapyId" varchar NOT NULL,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
        "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "FK_booking_agent" FOREIGN KEY ("agentId")
          REFERENCES "agent" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_booking_therapy" FOREIGN KEY ("therapyId")
          REFERENCES "therapy" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_booking_agent" ON "booking" ("agentId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_booking_therapy" ON "booking" ("therapyId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "ailment_therapy" (
        "ailment_id" varchar NOT NULL,
        "therapy_id" varchar NOT NULL,
        PRIMARY KEY ("ailment_id", "therapy_id"),
        CONSTRAINT "FK_ailment_therapy_ailment" FOREIGN KEY ("ailment_id")
          REFERENCES "ailment" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ailment_therapy_therapy" FOREIGN KEY ("therapy_id")
          REFERENCES "therapy" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_ailment_therapy_ailment" ON "ailment_therapy" ("ailment_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ailment_therapy_therapy" ON "ailment_therapy" ("therapy_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ailment_therapy"`);
    await queryRunner.query(`DROP TABLE "booking"`);
    await queryRunner.query(`DROP TABLE "ailment"`);
    await queryRunner.query(`DROP TABLE "therapy"`);
    await queryRunner.query(`DROP TABLE "agent"`);
  }
}
