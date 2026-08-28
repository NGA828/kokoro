import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { dateTransformer } from '../common/value-transformers';
import { Profile } from './profile.entity';

export enum PhotoSource {
  CLOUDINARY = 'cloudinary',
  LOCAL = 'local',
  EXTERNAL = 'external',
}

@Entity('profile_photos')
export class ProfilePhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'profile_id', length: 36 })
  profileId: string;

  @ManyToOne(() => Profile, (p) => p.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'varchar', length: 16, default: PhotoSource.EXTERNAL })
  source: PhotoSource;

  @Column({ type: 'varchar', name: 'public_id', length: 255, nullable: true })
  publicId: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
