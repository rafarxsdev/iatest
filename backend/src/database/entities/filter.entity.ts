import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { FilterType } from './filter-type.entity';
import { Card } from './card.entity';

@Entity({ schema: 'content', name: 'filters' })
export class Filter {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  label!: string;

  @Column({ type: 'varchar', length: 100 })
  value!: string;

  @Column({ type: 'jsonb' })
  configuration!: Record<string, unknown>;

  @Column({ type: 'int' })
  sortOrder!: number;

  @Column({ type: 'boolean' })
  isActive!: boolean;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => FilterType, (ft) => ft.filters)
  @JoinColumn({ name: 'filter_type_id' })
  filterType!: FilterType;

  @ManyToOne(() => Filter, (f) => f.children, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_filter_id' })
  parent!: Filter | null;

  @OneToMany(() => Filter, (f) => f.parent)
  children!: Filter[];

  @OneToMany(() => Card, (card) => card.filter)
  cards!: Card[];
}
