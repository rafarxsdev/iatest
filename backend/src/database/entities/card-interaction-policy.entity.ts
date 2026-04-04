import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Card } from './card.entity';
import { Role } from './role.entity';
import { ResetPolicy } from './reset-policy.entity';

@Entity({ schema: 'interactions', name: 'card_interaction_policies' })
export class CardInteractionPolicy {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  maxInteractions!: number;

  @Column({ type: 'boolean' })
  isActive!: boolean;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Card, (card) => card.cardInteractionPolicies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id' })
  card!: Card;

  @ManyToOne(() => Role, (role) => role.cardInteractionPolicies, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: Role | null;

  @ManyToOne(() => ResetPolicy, (rp) => rp.cardInteractionPolicies)
  @JoinColumn({ name: 'reset_policy_id' })
  resetPolicy!: ResetPolicy;
}
