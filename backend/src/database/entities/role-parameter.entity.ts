import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from './role.entity';
import { Parameter } from './parameter.entity';
import { User } from './user.entity';

@Entity({ schema: 'config', name: 'role_parameters' })
export class RoleParameter {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  value!: string;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Role, (role) => role.roleParameters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @ManyToOne(() => Parameter, (p) => p.roleParameters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parameter_id' })
  parameter!: Parameter;

  @ManyToOne(() => User, (user) => user.roleParametersUpdated, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by_user_id' })
  updatedBy!: User | null;
}
