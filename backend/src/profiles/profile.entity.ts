import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { dateTransformer } from '../common/value-transformers';
import { ProfilePhoto } from './profile-photo.entity';

export enum Gender {
  FEMALE = 'female',
  MALE = 'male',
  OTHER = 'other',
}

export enum RelationshipIntention {
  LONG_TERM = 'long_term',
  SERIOUS = 'serious',
  FRIENDSHIP = 'friendship',
  CASUAL = 'casual',
  NOT_SURE = 'not_sure',
}

export enum VerificationStatus {
  NONE = 'none',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', name: 'user_id', length: 36 })
  userId: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'date', nullable: true, transformer: dateTransformer })
  dob: Date | null;

  @Column({ type: 'varchar', length: 16, default: Gender.OTHER })
  gender: Gender;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  country: string | null;

  @Column({ type: 'float', nullable: true })
  lat: number | null;

  @Column({ type: 'float', nullable: true })
  lng: number | null;

  @Column({ name: 'main_photo_url', type: 'varchar', length: 500, nullable: true })
  mainPhotoUrl: string | null;

  @Column({ type: 'varchar', length: 16, default: VerificationStatus.NONE })
  verification: VerificationStatus;

  @Column({ name: 'verification_requested_at', type: 'datetime', nullable: true, transformer: dateTransformer })
  verificationRequestedAt: Date | null;

  @Column({ name: 'onboarding_completed', type: 'boolean', default: false })
  onboardingCompleted: boolean;

  /** Active boost expiry (null when not boosted). */
  @Column({ name: 'boosted_until', type: 'datetime', nullable: true, transformer: dateTransformer })
  boostedUntil: Date | null;

  /** Optional anime-style avatar / profile theme. */
  @Column({ type: 'varchar', name: 'avatar_style', length: 32, nullable: true })
  avatarStyle: string | null;

  @Column({ type: 'varchar', name: 'profile_theme', length: 32, nullable: true })
  profileTheme: string | null;

  @OneToMany(() => ProfilePhoto, (p) => p.profile, { cascade: true })
  photos: ProfilePhoto[];
}
