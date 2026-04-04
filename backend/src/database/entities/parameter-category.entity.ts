import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Parameter } from './parameter.entity';

@Entity({ schema: 'config', name: 'parameter_categories' })
export class ParameterCategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => Parameter, (p) => p.category)
  parameters!: Parameter[];
}
