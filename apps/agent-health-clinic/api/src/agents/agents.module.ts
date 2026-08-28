import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from '../entities/agent.entity.js';

/** Feature module owning the {@link Agent} entity. */
@Module({
  imports: [TypeOrmModule.forFeature([Agent])],
  exports: [TypeOrmModule],
})
export class AgentsModule {}
