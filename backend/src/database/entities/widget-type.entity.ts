import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Card } from './card.entity';

@Entity({ schema: 'content', name: 'widget_types' })
export class WidgetType {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  label!: string;

  @Column({ type: 'int', nullable: true })
  defaultMaxInteractions!: number | null;

  @Column({ type: 'jsonb' })
  configurationSchema!: Record<string, unknown>;

  @Column({ type: 'boolean' })
  isActive!: boolean;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => Card, (card) => card.widgetType)
  cards!: Card[];
}
