import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from './role.entity';
import { UserSecurityStatus } from './user-security-status.entity';
import { Session } from './session.entity';
import { Parameter } from './parameter.entity';
import { RoleParameter } from './role-parameter.entity';
import { UserParameter } from './user-parameter.entity';
import { UserCardInteraction } from './user-card-interaction.entity';
import { AuditLog } from './audit-log.entity';
import { AuthLog } from './auth-log.entity';
import { InteractionLog } from './interaction-log.entity';

@Entity({ schema: 'security', name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'citext' })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 150 })
  fullName!: string;

  @Column({ type: 'boolean' })
  isActive!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @OneToOne(() => UserSecurityStatus, (uss) => uss.user)
  userSecurityStatus!: UserSecurityStatus;

  @OneToMany(() => Session, (session) => session.user)
  sessions!: Session[];

  @OneToMany(() => Parameter, (parameter) => parameter.updatedBy)
  parametersUpdated!: Parameter[];

  @OneToMany(() => RoleParameter, (rp) => rp.updatedBy)
  roleParametersUpdated!: RoleParameter[];

  @OneToMany(() => UserParameter, (up) => up.user)
  userParameters!: UserParameter[];

  @OneToMany(() => UserParameter, (up) => up.updatedBy)
  userParametersUpdated!: UserParameter[];

  @OneToMany(() => UserCardInteraction, (uci) => uci.user)
  userCardInteractions!: UserCardInteraction[];

  @OneToMany(() => AuditLog, (log) => log.user)
  auditLogs!: AuditLog[];

  @OneToMany(() => AuthLog, (log) => log.user)
  authLogs!: AuthLog[];

  @OneToMany(() => InteractionLog, (log) => log.user)
  interactionLogs!: InteractionLog[];
}
