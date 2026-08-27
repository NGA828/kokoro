import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum ProfileVisibility {
  PUBLIC = 'public',
  HIDDEN = 'hidden',
}

@Entity('user_settings')
export class UserSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'user_id', length: 36, unique: true })
  userId: string;

  @OneToOne(() => User, (u) => u.settings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', name: 'profile_visibility', length: 16, default: ProfileVisibility.PUBLIC })
  profileVisibility: ProfileVisibility;

  @Column({ name: 'show_online_status', type: 'boolean', default: true })
  showOnlineStatus: boolean;

  @Column({ name: 'show_distance', type: 'boolean', default: true })
  showDistance: boolean;

  @Column({ name: 'notif_message', type: 'boolean', default: true })
  notifMessage: boolean;

  @Column({ name: 'notif_like', type: 'boolean', default: true })
  notifLike: boolean;

  @Column({ name: 'notif_match', type: 'boolean', default: true })
  notifMatch: boolean;

  @Column({ name: 'notif_system', type: 'boolean', default: true })
  notifSystem: boolean;
}
