import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../entities/booking.entity.js';

/** Feature module owning the {@link Booking} entity. */
@Module({
  imports: [TypeOrmModule.forFeature([Booking])],
  exports: [TypeOrmModule],
})
export class BookingsModule {}
