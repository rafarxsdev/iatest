import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { AuthLog } from './auth-log.entity';
import { InteractionLog } from './interaction-log.entity';

@Entity({ schema: 'logs', name: 'action_types' })
export class ActionType {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  code!: string;

  @Column({ type: 'varchar', length: 50 })
  module!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'boolean' })
  isActive!: boolean;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => AuditLog, (log) => log.actionType)
  auditLogs!: AuditLog[];

  @OneToMany(() => AuthLog, (log) => log.actionType)
  authLogs!: AuthLog[];

  @OneToMany(() => InteractionLog, (log) => log.actionType)
  interactionLogs!: InteractionLog[];
}
