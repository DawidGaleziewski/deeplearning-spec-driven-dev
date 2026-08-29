import { Controller, Get } from '@nestjs/common';

/** Shape returned by `GET /health`. */
export interface HealthStatus {
  status: 'ok';
  uptime: number;
  timestamp: string;
}

/**
 * Liveness probe. Deliberately does **not** touch the database or any other
 * dependency — it only reports that the process is up and serving HTTP.
 * Readiness checks (DB, external services) can move to `@nestjs/terminus` once
 * there is something worth reporting on.
 */
@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthStatus {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
