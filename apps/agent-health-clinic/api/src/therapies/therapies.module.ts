import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Therapy } from '../entities/therapy.entity.js';

/** Feature module owning the {@link Therapy} entity. */
@Module({
  imports: [TypeOrmModule.forFeature([Therapy])],
  exports: [TypeOrmModule],
})
export class TherapiesModule {}
