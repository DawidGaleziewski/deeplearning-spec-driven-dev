import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Agent } from './agent.entity.js';
import { Therapy } from './therapy.entity.js';

/**
 * A complaint an agent presents with (vague prompts, 2am pings, scope creep…).
 * Belongs to at most one agent and carries a list of recommended therapies.
 */
@Entity()
export class Ailment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  /**
   * The presenting agent. Nullable so the test UI can create an ailment first
   * and attach it to an agent afterwards.
   */
  @Index()
  @ManyToOne(() => Agent, (agent) => agent.ailments, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  agent!: Agent | null;

  /**
   * Recommended therapies. Many-to-many: a therapy can treat several ailments
   * and an ailment can have several recommended therapies.
   */
  @ManyToMany(() => Therapy, (therapy) => therapy.ailments)
  @JoinTable({
    name: 'ailment_therapy',
    joinColumn: { name: 'ailment_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'therapy_id', referencedColumnName: 'id' },
  })
  recommendedTherapies!: Therapy[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
