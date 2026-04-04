import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CardInteractionPolicy } from './card-interaction-policy.entity';
import { UserCardInteraction } from './user-card-interaction.entity';
import { InteractionLog } from './interaction-log.entity';

@Entity({ schema: 'interactions', name: 'reset_policies' })
export class ResetPolicy {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => CardInteractionPolicy, (cip) => cip.resetPolicy)
  cardInteractionPolicies!: CardInteractionPolicy[];

  @OneToMany(() => UserCardInteraction, (uci) => uci.resetPolicy)
  userCardInteractions!: UserCardInteraction[];

  @OneToMany(() => InteractionLog, (il) => il.resetPolicy)
  interactionLogs!: InteractionLog[];
}
