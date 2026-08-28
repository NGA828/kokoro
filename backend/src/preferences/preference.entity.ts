import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Gender, RelationshipIntention } from '../profiles/profile.entity';

export enum ShowMe {
  FEMALE = Gender.FEMALE,
  MALE = Gender.MALE,
  OTHER = Gender.OTHER,
  EVERYONE = 'everyone',
}

@Entity('dating_preferences')
export class Preference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', name: 'user_id', length: 36 })
  userId: string;

  @Column({ type: 'varchar', length: 16, default: ShowMe.EVERYONE })
  showMe: ShowMe;

  @Column({ name: 'age_min', type: 'int', default: 21 })
  ageMin: number;

  @Column({ name: 'age_max', type: 'int', default: 35 })
  ageMax: number;

  @Column({ name: 'max_distance_km', type: 'int', default: 50 })
  maxDistanceKm: number;

  @Column({ type: 'varchar', length: 24, default: RelationshipIntention.LONG_TERM })
  intention: RelationshipIntention;
}
