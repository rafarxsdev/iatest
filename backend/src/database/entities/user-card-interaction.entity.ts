import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Card } from './card.entity';
import { ResetPolicy } from './reset-policy.entity';

@Entity({ schema: 'interactions', name: 'user_card_interactions' })
export class UserCardInteraction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  interactionCount!: number;

  @Column({ type: 'int' })
  limitAtCreation!: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastResetAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  limitReachedAt!: Date | null;

  @Column({ type: 'timestamptz' })
  lastInteractionAt!: Date;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.userCardInteractions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Card, (card) => card.userCardInteractions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id' })
  card!: Card;

  @ManyToOne(() => ResetPolicy, (rp) => rp.userCardInteractions)
  @JoinColumn({ name: 'reset_policy_id' })
  resetPolicy!: ResetPolicy;
}
