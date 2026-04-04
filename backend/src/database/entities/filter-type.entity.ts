import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Filter } from './filter.entity';

@Entity({ schema: 'content', name: 'filter_types' })
export class FilterType {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => Filter, (f) => f.filterType)
  filters!: Filter[];
}
