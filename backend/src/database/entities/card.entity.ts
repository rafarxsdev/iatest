import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Filter } from './filter.entity';
import { WidgetType } from './widget-type.entity';
import { CardInteractionPolicy } from './card-interaction-policy.entity';
import { UserCardInteraction } from './user-card-interaction.entity';
import { InteractionLog } from './interaction-log.entity';

@Entity({ schema: 'content', name: 'cards' })
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  htmlContent!: string;

  @Column({ type: 'jsonb' })
  widgetConfiguration!: Record<string, unknown>;

  @Column({ name: 'icon_name', type: 'varchar', length: 100, nullable: true })
  iconName!: string | null;

  @Column({ type: 'int' })
  sortOrder!: number;

  @Column({ type: 'boolean' })
  isActive!: boolean;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @ManyToOne(() => Filter, (filter) => filter.cards)
  @JoinColumn({ name: 'filter_id' })
  filter!: Filter;

  @ManyToOne(() => WidgetType, (wt) => wt.cards)
  @JoinColumn({ name: 'widget_type_id' })
  widgetType!: WidgetType;

  @OneToMany(() => CardInteractionPolicy, (cip) => cip.card)
  cardInteractionPolicies!: CardInteractionPolicy[];

  @OneToMany(() => UserCardInteraction, (uci) => uci.card)
  userCardInteractions!: UserCardInteraction[];

  @OneToMany(() => InteractionLog, (il) => il.card)
  interactionLogs!: InteractionLog[];
}
