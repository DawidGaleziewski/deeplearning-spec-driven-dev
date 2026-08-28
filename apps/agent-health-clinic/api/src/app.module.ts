import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { AgentsModule } from './agents/agents.module.js';
import { AilmentsModule } from './ailments/ailments.module.js';
import { TherapiesModule } from './therapies/therapies.module.js';
import { BookingsModule } from './bookings/bookings.module.js';
import { DevModule, isDevUiEnabled } from './dev/dev.module.js';

@Module({
  imports: [
    DatabaseModule,
    AgentsModule,
    AilmentsModule,
    TherapiesModule,
    BookingsModule,
    ...(isDevUiEnabled() ? [DevModule] : []),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
