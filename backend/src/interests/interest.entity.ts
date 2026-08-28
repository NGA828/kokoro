import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum InterestCategory {
  POP_CULTURE = 'pop_culture',
  MUSIC = 'music',
  SPORTS = 'sports',
  LIFESTYLE = 'lifestyle',
  ARTS = 'arts',
  TECH = 'tech',
  SOCIAL = 'social',
}

@Entity('interests')
export class Interest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  slug: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  emoji: string | null;

  @Column({ type: 'varchar', length: 24, default: InterestCategory.LIFESTYLE })
  category: InterestCategory;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}

@Entity('user_interests')
export class UserInterest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', name: 'user_id', length: 36 })
  userId: string;

  @Index()
  @Column({ type: 'varchar', name: 'interest_id', length: 36 })
  interestId: string;

  @ManyToOne(() => Interest)
  @JoinColumn({ name: 'interest_id' })
  interest: Interest;
}
