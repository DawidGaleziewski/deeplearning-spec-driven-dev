import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DATABASE_PATH ?? 'data/dev.sqlite',
      entities: [],
      synchronize: false,
    }),
  ],
})
export class DatabaseModule {}
