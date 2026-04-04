import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ParameterCategory } from './parameter-category.entity';
import { User } from './user.entity';
import { RoleParameter } from './role-parameter.entity';
import { UserParameter } from './user-parameter.entity';

@Entity({ schema: 'config', name: 'parameters' })
export class Parameter {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  key!: string;

  @Column({ type: 'text' })
  value!: string;

  @Column({ type: 'varchar', length: 20 })
  dataType!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'boolean' })
  isEditable!: boolean;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => ParameterCategory, (c) => c.parameters)
  @JoinColumn({ name: 'category_id' })
  category!: ParameterCategory;

  @ManyToOne(() => User, (user) => user.parametersUpdated, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by_user_id' })
  updatedBy!: User | null;

  @OneToMany(() => RoleParameter, (rp) => rp.parameter)
  roleParameters!: RoleParameter[];

  @OneToMany(() => UserParameter, (up) => up.parameter)
  userParameters!: UserParameter[];
}
