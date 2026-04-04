import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Card } from './card.entity';
import { Session } from './session.entity';
import { ActionType } from './action-type.entity';
import { ResetPolicy } from './reset-policy.entity';

@Entity({ schema: 'logs', name: 'interaction_logs' })
export class InteractionLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  interactionNumber!: number;

  @Column({ type: 'int' })
  maxAtMoment!: number;

  @Column({ type: 'inet', nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  payload!: Record<string, unknown> | null;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.interactionLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Card, (card) => card.interactionLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id' })
  card!: Card;

  @ManyToOne(() => Session, (session) => session.interactionLogs, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'session_id' })
  session!: Session | null;

  @ManyToOne(() => ActionType, (at) => at.interactionLogs)
  @JoinColumn({ name: 'action_type_id' })
  actionType!: ActionType;

  @ManyToOne(() => ResetPolicy, (rp) => rp.interactionLogs)
  @JoinColumn({ name: 'reset_policy_id' })
  resetPolicy!: ResetPolicy;
}
