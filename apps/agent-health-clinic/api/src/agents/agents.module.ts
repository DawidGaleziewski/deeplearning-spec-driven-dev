import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from '../entities/agent.entity.js';
import { AilmentsModule } from '../ailments/ailments.module.js';
import { AgentsController } from './agents.controller.js';
import { AgentsService } from './agents.service.js';

/**
 * Feature module owning the {@link Agent} entity and its REST surface. Imports
 * {@link AilmentsModule} so the `POST /agents/:id/ailments` check-in shortcut
 * can delegate to `AilmentsService`.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Agent]), AilmentsModule],
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [TypeOrmModule],
})
export class AgentsModule {}
