import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { mkdir, writeFile } from 'fs/promises';
import * as path from 'path';
import { buildTypeOrmOptions } from '../config/data-source';
import { User, UserRole, AccountStatus } from '../users/user.entity';
import { UserSettings } from '../users/user-settings.entity';
import {
  Profile,
  Gender,
  RelationshipIntention,
  VerificationStatus,
} from '../profiles/profile.entity';
import { ProfilePhoto } from '../profiles/profile-photo.entity';
import { Preference, ShowMe } from '../preferences/preference.entity';
import { Interest, UserInterest, InterestCategory } from '../interests/interest.entity';
import { PremiumPlan } from '../premium/premium.entities';
import { SEED_INTERESTS, SEED_PEOPLE } from './seed-data';
import { generateAvatarSvg } from './avatar-gen';

async function run() {
  console.log('🌱 Seeding Kokoro March database...');
  const ds = new DataSource(buildTypeOrmOptions() as never);
  await ds.initialize();

  const users = ds.getRepository(User);
  const settings = ds.getRepository(UserSettings);
  const profiles = ds.getRepository(Profile);
  const photos = ds.getRepository(ProfilePhoto);
  const preferences = ds.getRepository(Preference);
  const interests = ds.getRepository(Interest);
  const userInterests = ds.getRepository(UserInterest);
  const plans = ds.getRepository(PremiumPlan);

  // ── Interests catalog ──
  const interestBySlug = new Map<string, Interest>();
  for (const i of SEED_INTERESTS) {
    let row = await interests.findOne({ where: { slug: i.slug } });
    if (!row) {
      row = interests.create({
        slug: i.slug,
        name: i.name,
        emoji: i.emoji,
        category: i.category as InterestCategory,
        active: true,
      });
      row = await interests.save(row);
    }
    interestBySlug.set(i.slug, row);
  }
  console.log(`   ${interestBySlug.size} interests ready`);

  // ── Premium plans ──
  const seedPlans = [
    {
      name: 'Kokoro Premium — Monthly',
      price: 4500,
      currency: 'XAF',
      periodDays: 30,
      dailyLikeLimit: 200,
      superLikesPerWeek: 5,
      includesBoost: false,
      seeWhoLikesYou: true,
      advancedFilters: true,
      position: 1,
    },
    {
      name: 'Kokoro Premium — Yearly',
      price: 45000,
      currency: 'XAF',
      periodDays: 365,
      dailyLikeLimit: 500,
      superLikesPerWeek: 20,
      includesBoost: true,
      seeWhoLikesYou: true,
      advancedFilters: true,
      position: 2,
    },
  ];
  for (const p of seedPlans) {
    const exists = await plans.findOne({ where: { name: p.name } });
    if (!exists) await plans.save(plans.create({ ...p, tier: 'premium' as never, isActive: true }));
  }
  console.log('   Premium plans ready');

  // ── Local SVG avatars (dev placeholders) ──
  const avatarDir = path.join(process.cwd(), 'uploads', 'avatars');
  await mkdir(avatarDir, { recursive: true });

  // ── Admin account ──
  const adminEmail = 'admin@kokoro.test';
  let admin = await users.findOne({ where: { email: adminEmail } });
  if (!admin) {
    admin = await users.save(
      users.create({
        email: adminEmail,
        passwordHash: await bcrypt.hash('Admin123!', 10),
        name: 'Kokoro Admin',
        role: UserRole.ADMIN,
        isEmailVerified: true,
        status: AccountStatus.ACTIVE,
        lastActiveAt: new Date(),
      }),
    );
    await settings.save(settings.create({ userId: admin.id }));
    console.log('   Admin: admin@kokoro.test / Admin123!');
  }

  // ── Demo users ──
  for (const person of SEED_PEOPLE) {
    let user = await users.findOne({ where: { email: person.email } });
    if (!user) {
      user = await users.save(
        users.create({
          email: person.email,
          passwordHash: await bcrypt.hash(person.password, 10),
          name: person.name,
          role: UserRole.USER,
          isEmailVerified: true,
          status: AccountStatus.ACTIVE,
          lastActiveAt: new Date(
            Date.now() - person.lastActiveDaysAgo * 86400000,
          ),
        }),
      );
      await settings.save(settings.create({ userId: user.id }));
    }

    let profile = await profiles.findOne({ where: { userId: user.id } });
    const avatarName = `${person.email.replace(/[^a-z0-9]/gi, '_')}.svg`;
    await writeFile(
      path.join(avatarDir, avatarName),
      generateAvatarSvg(person.email, person.name),
    );
    const avatarUrl = `/media/avatars/${avatarName}`;

    if (!profile) {
      profile = profiles.create({ userId: user.id });
    }
    profile.name = person.name;
    profile.dob = new Date(person.dob);
    profile.gender = person.gender as Gender;
    profile.bio = person.bio;
    profile.city = person.city;
    profile.country = person.country;
    profile.lat = person.lat;
    profile.lng = person.lng;
    profile.mainPhotoUrl = avatarUrl;
    profile.verification = person.verified
      ? VerificationStatus.VERIFIED
      : VerificationStatus.NONE;
    profile.onboardingCompleted = true;
    await profiles.save(profile);

    const existingPhoto = await photos.findOne({
      where: { profileId: profile.id },
    });
    if (!existingPhoto) {
      await photos.save(
        photos.create({
          profileId: profile.id,
          url: avatarUrl,
          source: 'local' as never,
          sortOrder: 0,
        }),
      );
    }

    let pref = await preferences.findOne({ where: { userId: user.id } });
    if (!pref) pref = preferences.create({ userId: user.id });
    pref.showMe = person.showMe as ShowMe;
    pref.intention = person.intention as RelationshipIntention;
    pref.ageMin = person.ageMin;
    pref.ageMax = person.ageMax;
    pref.maxDistanceKm = 150;
    await preferences.save(pref);

    // Interests (re-link)
    await userInterests.delete({ userId: user.id });
    for (const slug of person.interests) {
      const interest = interestBySlug.get(slug);
      if (interest) {
        await userInterests.save(
          userInterests.create({ userId: user.id, interestId: interest.id }),
        );
      }
    }
  }
  console.log(`   ${SEED_PEOPLE.length} demo profiles ready`);

  console.log('');
  console.log('✅ Seed complete.');
  console.log('   Demo logins (password: Password123):');
  console.log('   • vanessa@kokoro.test  (Yaoundé)');
  console.log('   • amara@kokoro.test    (Lagos)');
  console.log('   Admin: admin@kokoro.test / Admin123!');
  await ds.destroy();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
