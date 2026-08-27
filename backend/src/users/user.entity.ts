import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { dateTransformer } from '../common/value-transformers';
import { UserSettings } from './user-settings.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum AccountStatus {
  ACTIVE = 'active',
  DEACTIVATED = 'deactivated',
  DELETED = 'deleted',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 191 })
  email: string;

  @Column({ type: 'varchar', name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 16, default: UserRole.USER })
  role: UserRole;

  @Column({ name: 'is_email_verified', type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'varchar', name: 'email_verify_token', length: 255, nullable: true })
  emailVerifyToken: string | null;

  @Column({ type: 'varchar', name: 'reset_token_hash', length: 255, nullable: true })
  resetTokenHash: string | null;

  @Column({ name: 'reset_token_expires', type: 'datetime', nullable: true, transformer: dateTransformer })
  resetTokenExpires: Date | null;

  /** Hash of the currently valid refresh token (rotated on login). */
  @Column({ type: 'varchar', name: 'refresh_token_hash', length: 255, nullable: true })
  refreshTokenHash: string | null;

  @Column({ type: 'varchar', length: 16, default: AccountStatus.ACTIVE })
  status: AccountStatus;

  @Column({ name: 'last_active_at', type: 'datetime', nullable: true, transformer: dateTransformer })
  lastActiveAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @OneToOne(() => UserSettings, (s) => s.user, { cascade: true })
  settings: UserSettings;
}
