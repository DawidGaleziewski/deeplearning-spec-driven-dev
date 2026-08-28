import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Agent } from './agent.entity.js';
import { Therapy } from './therapy.entity.js';
import { BOOKING_STATUSES, type BookingStatus } from './booking-status.js';

/** Links one agent to one therapy at a scheduled time. */
@Entity()
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @ManyToOne(() => Agent, { nullable: false, onDelete: 'CASCADE' })
  agent!: Agent;

  @Index()
  @ManyToOne(() => Therapy, { nullable: false, onDelete: 'CASCADE' })
  therapy!: Therapy;

  @Column({ type: 'datetime' })
  scheduledAt!: Date;

  /**
   * Emulated as a `varchar` + CHECK constraint on SQLite, so an invalid status
   * is rejected at the database level. Lifecycle transitions arrive in Phase 5.
   */
  @Column({ type: 'simple-enum', enum: BOOKING_STATUSES, default: 'requested' })
  status!: BookingStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
