import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ailment } from './ailment.entity.js';

/**
 * A treatment offered by the clinic. `format` and `durationMinutes` are simple
 * typed fields now (Phase 4 owns the therapy-directory UI); kept minimal.
 */
@Entity()
export class Therapy {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  /** e.g. "1:1 session", "group workshop", "self-guided". */
  @Column({ type: 'varchar', nullable: true })
  format!: string | null;

  @Column({ type: 'integer', nullable: true })
  durationMinutes!: number | null;

  /** Ailments this therapy is recommended for (inverse side of the join). */
  @ManyToMany(() => Ailment, (ailment) => ailment.recommendedTherapies)
  ailments!: Ailment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
