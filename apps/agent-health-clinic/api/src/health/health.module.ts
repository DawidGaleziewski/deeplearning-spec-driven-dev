import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';

/**
 * Standalone liveness endpoint (`GET /health`). Has no providers and no
 * dependency on {@link DatabaseModule} — that isolation is the point.
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
