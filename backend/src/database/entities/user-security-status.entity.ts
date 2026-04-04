import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ schema: 'security', name: 'user_security_status' })
export class UserSecurityStatus {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  failedLoginAttempts!: number;

  @Column({ type: 'timestamptz', nullable: true })
  loginBlockedUntil!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastFailedAttemptAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  passwordChangedAt!: Date | null;

  @Column({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToOne(() => User, (user) => user.userSecurityStatus, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
