import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { Session } from './session.entity';
import { ActionType } from './action-type.entity';

@Entity({ schema: 'logs', name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  entityType!: string | null;

  @Column({ type: 'uuid', nullable: true })
  entityId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  payload!: Record<string, unknown> | null;

  @Column({ type: 'inet', nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent!: string | null;

  @Column({ type: 'varchar', length: 20 })
  status!: string;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ type: 'int', nullable: true })
  durationMs!: number | null;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.auditLogs, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @ManyToOne(() => Session, (session) => session.auditLogs, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'session_id' })
  session!: Session | null;

  @ManyToOne(() => ActionType, (at) => at.auditLogs)
  @JoinColumn({ name: 'action_type_id' })
  actionType!: ActionType;
}
