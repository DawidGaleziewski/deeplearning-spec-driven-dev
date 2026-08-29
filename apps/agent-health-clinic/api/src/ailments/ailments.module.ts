import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from '../entities/agent.entity.js';
import { Ailment } from '../entities/ailment.entity.js';
import { AilmentsController } from './ailments.controller.js';
import { AilmentsService } from './ailments.service.js';

/**
 * Feature module owning the {@link Ailment} entity and its REST surface. Also
 * holds a repository handle for {@link Agent} — read-only, to resolve the
 * `agentId` on an ailment — which is the one sanctioned cross-entity reach.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Ailment, Agent])],
  controllers: [AilmentsController],
  providers: [AilmentsService],
  exports: [AilmentsService, TypeOrmModule],
})
export class AilmentsModule {}
