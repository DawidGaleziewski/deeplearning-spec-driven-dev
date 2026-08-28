import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ailment } from '../entities/ailment.entity.js';

/** Feature module owning the {@link Ailment} entity. */
@Module({
  imports: [TypeOrmModule.forFeature([Ailment])],
  exports: [TypeOrmModule],
})
export class AilmentsModule {}
