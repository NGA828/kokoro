import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Profile,
  VerificationStatus,
} from './profile.entity';
import { ProfilePhoto } from './profile-photo.entity';
import { Preference, ShowMe } from '../preferences/preference.entity';
import { UserInterest } from '../interests/interest.entity';
import { User } from '../users/user.entity';
import { ageFromDob } from '../common/utils';
import { OnboardingDto, UpdateProfileDto } from './profiles.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profiles: Repository<Profile>,
    @InjectRepository(ProfilePhoto)
    private readonly photos: Repository<ProfilePhoto>,
    @InjectRepository(Preference)
    private readonly preferences: Repository<Preference>,
    @InjectRepository(UserInterest)
    private readonly userInterests: Repository<UserInterest>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async getOrCreate(userId: string): Promise<Profile> {
    let profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) {
      const user = await this.users.findOne({ where: { id: userId } });
      profile = this.profiles.create({
        userId,
        name: user?.name || 'New member',
      });
      profile = await this.profiles.save(profile);
    }
    return profile;
  }

  async getPreference(userId: string): Promise<Preference> {
    let pref = await this.preferences.findOne({ where: { userId } });
    if (!pref) {
      pref = this.preferences.create({ userId });
      pref = await this.preferences.save(pref);
    }
    return pref;
  }

  /** Full own-profile payload used by the dashboard / profile editor. */
  async getMyProfile(userId: string) {
    const profile = await this.getOrCreate(userId);
    const [photos, preferences, interestRows] = await Promise.all([
      this.photos.find({
        where: { profileId: profile.id, active: true },
        order: { sortOrder: 'ASC' },
      }),
      this.getPreference(userId),
      this.userInterests.find({
        where: { userId },
        relations: ['interest'],
      }),
    ]);
    return {
      ...this.serialize(profile, photos),
      preferences,
      interests: interestRows.map((r) => r.interest).filter(Boolean),
      completion: this.completion(profile, photos.length, interestRows.length),
      onboardingCompleted: profile.onboardingCompleted,
    };
  }

  async update(userId: string, dto: UpdateProfileDto) {
    const profile = await this.getOrCreate(userId);
    if (dto.dob) {
      const age = ageFromDob(dto.dob);
      if (age < 18) throw new BadRequestException('You must be 18 or older.');
      if (age > 120) throw new BadRequestException('Please enter a valid date of birth.');
      profile.dob = new Date(dto.dob);
    }
    const fields: (keyof UpdateProfileDto)[] = [
      'name',
      'gender',
      'bio',
      'city',
      'country',
      'mainPhotoUrl',
      'avatarStyle',
      'profileTheme',
    ];
    for (const f of fields) {
      if (dto[f] !== undefined) {
        (profile as unknown as Record<string, unknown>)[f] = dto[f];
      }
    }
    // Keep user.name in sync for emails/admin.
    if (dto.name) {
      await this.users.update({ id: userId }, { name: dto.name });
    }
    await this.profiles.save(profile);
    return this.getMyProfile(userId);
  }

  async completeOnboarding(userId: string, dto: OnboardingDto) {
    const profile = await this.getOrCreate(userId);
    if (dto.name) profile.name = dto.name;
    if (dto.gender) profile.gender = dto.gender as never;
    if (dto.bio !== undefined) profile.bio = dto.bio;
    if (dto.city !== undefined) profile.city = dto.city;
    if (dto.country !== undefined) profile.country = dto.country;
    if (dto.mainPhotoUrl) profile.mainPhotoUrl = dto.mainPhotoUrl;
    if (dto.dob) {
      const age = ageFromDob(dto.dob);
      if (age < 18) throw new BadRequestException('You must be 18 or older.');
      profile.dob = new Date(dto.dob);
    }
    profile.onboardingCompleted = true;
    await this.profiles.save(profile);

    if (dto.name) await this.users.update({ id: userId }, { name: dto.name });

    const pref = await this.getPreference(userId);
    if (dto.intention) pref.intention = dto.intention as never;
    if (dto.showMe) pref.showMe = dto.showMe as ShowMe;
    if (dto.ageMin) pref.ageMin = dto.ageMin;
    if (dto.ageMax) pref.ageMax = dto.ageMax;
    if (dto.maxDistanceKm) pref.maxDistanceKm = dto.maxDistanceKm;
    if (pref.ageMin > pref.ageMax) {
      [pref.ageMin, pref.ageMax] = [pref.ageMax, pref.ageMin];
    }
    await this.preferences.save(pref);

    return this.getMyProfile(userId);
  }

  async addPhoto(userId: string, url: string, source = 'external', publicId?: string) {
    const profile = await this.getOrCreate(userId);
    const count = await this.photos.count({ where: { profileId: profile.id } });
    const photo = this.photos.create({
      profileId: profile.id,
      url,
      source: source as never,
      publicId: publicId ?? null,
      sortOrder: count,
    });
    await this.photos.save(photo);
    if (!profile.mainPhotoUrl) {
      profile.mainPhotoUrl = url;
      await this.profiles.save(profile);
    }
    return photo;
  }

  async removePhoto(userId: string, photoId: string) {
    const profile = await this.getOrCreate(userId);
    const photo = await this.photos.findOne({
      where: { id: photoId, profileId: profile.id },
    });
    if (!photo) throw new NotFoundException('Photo not found.');
    await this.photos.delete({ id: photoId });
    if (profile.mainPhotoUrl === photo.url) {
      const next = await this.photos.findOne({
        where: { profileId: profile.id, active: true },
        order: { sortOrder: 'ASC' },
      });
      profile.mainPhotoUrl = next?.url ?? null;
      await this.profiles.save(profile);
    }
    return { success: true };
  }

  async setMainPhoto(userId: string, photoId: string) {
    const profile = await this.getOrCreate(userId);
    const photo = await this.photos.findOne({
      where: { id: photoId, profileId: profile.id },
    });
    if (!photo) throw new NotFoundException('Photo not found.');
    profile.mainPhotoUrl = photo.url;
    await this.profiles.save(profile);
    return { success: true };
  }

  /** Request photo/identity verification (admins approve). */
  async requestVerification(userId: string) {
    const profile = await this.getOrCreate(userId);
    profile.verification = VerificationStatus.PENDING;
    profile.verificationRequestedAt = new Date();
    await this.profiles.save(profile);
    return { status: profile.verification };
  }

  completion(profile: Profile, photoCount: number, interestCount: number): number {
    let score = 0;
    if (profile.name) score += 10;
    if (profile.dob) score += 15;
    if (profile.gender && profile.gender !== ('other' as never)) score += 10;
    if (profile.city) score += 10;
    if (profile.mainPhotoUrl) score += 20;
    if (photoCount >= 2) score += 5;
    if (profile.bio && profile.bio.trim().length >= 20) score += 15;
    if (interestCount >= 3) score += 10;
    if (profile.onboardingCompleted) score += 5;
    return Math.min(100, score);
  }

  /** Public-safe profile shape for discovery / profile views. */
  serialize(profile: Profile, photos: ProfilePhoto[] = []) {
    return {
      id: profile.id,
      userId: profile.userId,
      name: profile.name,
      age: profile.dob ? ageFromDob(profile.dob) : null,
      gender: profile.gender,
      bio: profile.bio,
      city: profile.city,
      country: profile.country,
      lat: profile.lat,
      lng: profile.lng,
      mainPhotoUrl: profile.mainPhotoUrl,
      photos: photos.map((p) => ({ id: p.id, url: p.url })),
      verification: profile.verification,
      isVerified: profile.verification === VerificationStatus.VERIFIED,
      avatarStyle: profile.avatarStyle,
      profileTheme: profile.profileTheme,
      boostedUntil: profile.boostedUntil,
    };
  }
}
