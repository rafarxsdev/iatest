import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RolePermission } from './role-permission.entity';
import { RoleParameter } from './role-parameter.entity';
import { User } from './user.entity';
import { CardInteractionPolicy } from './card-interaction-policy.entity';

@Entity({ schema: 'security', name: 'roles' })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'boolean' })
  isActive!: boolean;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => RolePermission, (rp) => rp.role)
  rolePermissions!: RolePermission[];

  @OneToMany(() => User, (user) => user.role)
  users!: User[];

  @OneToMany(() => RoleParameter, (rp) => rp.role)
  roleParameters!: RoleParameter[];

  @OneToMany(() => CardInteractionPolicy, (cip) => cip.role)
  cardInteractionPolicies!: CardInteractionPolicy[];
}
