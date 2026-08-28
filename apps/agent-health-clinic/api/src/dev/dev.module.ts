import { Module } from '@nestjs/common';
import { AgentsModule } from '../agents/agents.module.js';
import { AilmentsModule } from '../ailments/ailments.module.js';
import { TherapiesModule } from '../therapies/therapies.module.js';
import { BookingsModule } from '../bookings/bookings.module.js';
import { DevController } from './dev.controller.js';

/**
 * Throwaway manual-testing UI + endpoints for Phase 1. Wired into
 * {@link AppModule} only when `NODE_ENV !== 'production'` (or `ENABLE_DEV_UI=true`).
 * Delete this module and `public/index.html` once Phase 2/3 land.
 */
@Module({
  imports: [AgentsModule, AilmentsModule, TherapiesModule, BookingsModule],
  controllers: [DevController],
})
export class DevModule {}

/** Whether the dev UI/endpoints should be registered in this environment. */
export function isDevUiEnabled(): boolean {
  return (
    process.env.ENABLE_DEV_UI === 'true' || process.env.NODE_ENV !== 'production'
  );
}
