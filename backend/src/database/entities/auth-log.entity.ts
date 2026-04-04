import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { ActionType } from './action-type.entity';
import { Session } from './session.entity';

@Entity({ schema: 'logs', name: 'auth_logs' })
export class AuthLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'citext' })
  emailAttempt!: string;

  @Column({ type: 'inet', nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent!: string | null;

  @Column({ type: 'int' })
  failedAttemptsAtMoment!: number;

  @Column({ type: 'timestamptz', nullable: true })
  loginBlockedUntil!: Date | null;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.authLogs, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @ManyToOne(() => ActionType, (at) => at.authLogs)
  @JoinColumn({ name: 'action_type_id' })
  actionType!: ActionType;

  @ManyToOne(() => Session, (session) => session.authLogs, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'session_id' })
  session!: Session | null;
}
