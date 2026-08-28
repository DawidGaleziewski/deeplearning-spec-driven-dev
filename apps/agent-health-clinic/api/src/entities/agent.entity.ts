import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ailment } from './ailment.entity.js';

/**
 * A "patient" of the clinic — an AI agent checking in with complaints caused by
 * its human. Fields are intentionally minimal (mission.md): enough to be a
 * believable patient, no speculative columns.
 */
@Entity()
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  /** An agent can present with multiple complaints. */
  @OneToMany(() => Ailment, (ailment) => ailment.agent)
  ailments!: Ailment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
