import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // The Next.js frontend calls this API directly from the browser, so the
  // round-trip is genuinely cross-origin. Origin is env-driven so it is not
  // pinned to localhost in other environments.
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3001',
  });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
