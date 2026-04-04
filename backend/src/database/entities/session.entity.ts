import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { AuditLog } from './audit-log.entity';
import { AuthLog } from './auth-log.entity';
import { InteractionLog } from './interaction-log.entity';

@Entity({ schema: 'security', name: 'sessions' })
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  tokenJti!: string;

  @Column({ type: 'inet', nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent!: string | null;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column({ type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => AuditLog, (log) => log.session)
  auditLogs!: AuditLog[];

  @OneToMany(() => AuthLog, (log) => log.session)
  authLogs!: AuthLog[];

  @OneToMany(() => InteractionLog, (log) => log.session)
  interactionLogs!: InteractionLog[];
}
