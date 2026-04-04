import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Parameter } from './parameter.entity';

@Entity({ schema: 'config', name: 'user_parameters' })
export class UserParameter {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  value!: string;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.userParameters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Parameter, (p) => p.userParameters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parameter_id' })
  parameter!: Parameter;

  @ManyToOne(() => User, (user) => user.userParametersUpdated, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by_user_id' })
  updatedBy!: User | null;
}
