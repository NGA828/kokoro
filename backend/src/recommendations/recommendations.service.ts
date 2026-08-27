import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import {
  Profile,
  RelationshipIntention,
  VerificationStatus,
} from '../profiles/profile.entity';
import { ProfilePhoto } from '../profiles/profile-photo.entity';
import { Preference, ShowMe } from '../preferences/preference.entity';
import { Like, LikeType } from '../likes/like.entity';
import { Match } from '../matches/match.entity';
import { Block } from '../blocks/block.entity';
import { Interest, UserInterest } from '../interests/interest.entity';
import { User, AccountStatus } from '../users/user.entity';
import { UserSettings, ProfileVisibility } from '../users/user-settings.entity';
import { ageFromDob, clamp, haversineKm } from '../common/utils';

export interface CompatibilityResult {
  score: number;
  breakdown: { label: string; points: number; max: number }[];
  reasons: string[];
  conversationStarters: string[];
}

export interface DiscoveryFilters {
  showMe?: string;
  ageMin?: number;
  ageMax?: number;
  maxDistanceKm?: number;
  intention?: string;
  limit?: number;
  offset?: number;
}

interface CandidateBundle {
  user: User;
  profile: Profile;
  photos: ProfilePhoto[];
  pref: Preference;
  interests: Interest[];
  settings: UserSettings | null;
}

/**
 * Compatibility + discovery engine.
 *
 * The scoring is transparent and rules-based today; it sits behind this
 * service so an ML/AI recommender can later replace (or re-rank) the results
 * without touching controllers — matching itself never depends on this score.
 */
@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(Profile) private readonly profiles: Repository<Profile>,
    @InjectRepository(ProfilePhoto) private readonly photos: Repository<ProfilePhoto>,
    @InjectRepository(Preference) private readonly preferences: Repository<Preference>,
    @InjectRepository(Like) private readonly likes: Repository<Like>,
    @InjectRepository(Match) private readonly matches: Repository<Match>,
    @InjectRepository(Block) private readonly blocks: Repository<Block>,
    @InjectRepository(Interest) private readonly interests: Repository<Interest>,
    @InjectRepository(UserInterest) private readonly userInterests: Repository<UserInterest>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(UserSettings) private readonly settings: Repository<UserSettings>,
  ) {}

  // ───────────────────────────── Discovery ─────────────────────────────

  async discover(myId: string, filters: DiscoveryFilters = {}) {
    const me = await this.bundleFor(myId);
    if (!me) return { items: [], hasMore: false };

    const myPref = me.pref;
    const showMe = (filters.showMe || myPref.showMe) as ShowMe;
    const ageMin = filters.ageMin ?? myPref.ageMin;
    const ageMax = filters.ageMax ?? myPref.ageMax;
    const maxDist = filters.maxDistanceKm ?? myPref.maxDistanceKm;
    const intention = filters.intention || myPref.intention;
    const limit = clamp(filters.limit ?? 20, 1, 50);
    const offset = filters.offset ?? 0;

    // Exclusions: blocked either direction, already swiped, already matched.
    const [blocks, myLikes, myMatches] = await Promise.all([
      this.blocks.find({
        where: [{ blockerId: myId }, { blockedId: myId }],
      }),
      this.likes.find({ where: { likerId: myId } }),
      this.matches.find({
        where: [
          { userOneId: myId, unmatched: false },
          { userTwoId: myId, unmatched: false },
        ],
      }),
    ]);
    const excluded = new Set<string>([myId]);
    blocks.forEach((b) => excluded.add(b.blockerId).add(b.blockedId));
    myLikes.forEach((l) => excluded.add(l.likedId));
    myMatches.forEach((m) => excluded.add(m.otherUserId(myId)));

    // Candidate pool: onboarded profiles with active, visible users.
    const profiles = await this.profiles.find({
      where: { onboardingCompleted: true },
    });
    const candidateIds = profiles
      .map((p) => p.userId)
      .filter((id) => !excluded.has(id));

    const users = candidateIds.length
      ? await this.users.find({ where: { id: In(candidateIds) } })
      : [];
    const activeUsers = users.filter(
      (u) => u.status === AccountStatus.ACTIVE,
    );
    const visibleSettings = activeUsers.length
      ? await this.settings.find({
          where: { userId: In(activeUsers.map((u) => u.id)) },
        })
      : [];
    const hidden = new Set(
      visibleSettings
        .filter((s) => s.profileVisibility === ProfileVisibility.HIDDEN)
        .map((s) => s.userId),
    );

    const scored: { bundle: CandidateBundle; comp: CompatibilityResult; distanceKm: number | null }[] = [];
    for (const user of activeUsers) {
      if (hidden.has(user.id)) continue;
      const bundle = await this.bundleFor(user.id, me);
      if (!bundle) continue;
      const age = bundle.profile.dob ? ageFromDob(bundle.profile.dob) : null;

      // Gender filter (their gender vs what I want).
      if (showMe !== ShowMe.EVERYONE && bundle.profile.gender !== (showMe as string)) {
        continue;
      }
      // Age filter.
      if (age !== null && (age < ageMin || age > ageMax)) continue;
      // Their preference must accept me (age/gender) — mutual relevance.
      const myAge = me.profile.dob ? ageFromDob(me.profile.dob) : null;
      if (
        myAge !== null &&
        (myAge < bundle.pref.ageMin || myAge > bundle.pref.ageMax)
      ) {
        continue;
      }
      if (
        bundle.pref.showMe !== ShowMe.EVERYONE &&
        bundle.pref.showMe !== (me.profile.gender as string)
      ) {
        continue;
      }
      // Distance filter.
      const distanceKm = this.distanceBetween(me.profile, bundle.profile);
      if (distanceKm !== null && distanceKm > maxDist) continue;

      const comp = this.score(me, bundle, distanceKm);
      // Intention soft-filter: strongly mismatched goals rank lower, not removed.
      scored.push({ bundle, comp, distanceKm });
    }

    scored.sort((a, b) => {
      const boost = (p: Profile) =>
        p.boostedUntil && p.boostedUntil.getTime() > Date.now() ? 1 : 0;
      const bd = boost(b.bundle.profile) - boost(a.bundle.profile);
      if (bd !== 0) return bd;
      // intention alignment tiebreak
      const ia = a.bundle.pref.intention === intention ? 1 : 0;
      const ib = b.bundle.pref.intention === intention ? 1 : 0;
      if (ib !== ia) return ib - ia;
      return b.comp.score - a.comp.score;
    });

    const page = scored.slice(offset, offset + limit);
    return {
      items: page.map(({ bundle, comp, distanceKm }) =>
        this.toCard(bundle, comp, distanceKm),
      ),
      total: scored.length,
      hasMore: offset + limit < scored.length,
    };
  }

  /** Build a single profile card (used by profile page, likes, blocks list). */
  async getProfileCard(
    myId: string,
    otherUserId: string,
    opts: { skipBlockCheck?: boolean } = {},
  ) {
    const [me, bundle, blocked] = await Promise.all([
      this.bundleFor(myId),
      this.bundleFor(otherUserId),
      this.skipBlockSafe(opts.skipBlockCheck, myId, otherUserId),
    ]);
    if (!bundle || bundle.user.status !== AccountStatus.ACTIVE) return null;
    if (blocked) return null;
    const distanceKm = me ? this.distanceBetween(me.profile, bundle.profile) : null;
    const comp = me ? this.score(me, bundle, distanceKm) : null;
    return this.toCard(bundle, comp, distanceKm);
  }

  private async skipBlockSafe(skip: boolean | undefined, a: string, b: string) {
    if (skip) return false;
    const count = await this.blocks.count({
      where: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    });
    return count > 0;
  }

  async compatibility(myId: string, otherId: string): Promise<CompatibilityResult | null> {
    const [me, other] = await Promise.all([
      this.bundleFor(myId),
      this.bundleFor(otherId),
    ]);
    if (!me || !other) return null;
    const distanceKm = this.distanceBetween(me.profile, other.profile);
    return this.score(me, other, distanceKm);
  }

  // ───────────────────────────── Scoring ───────────────────────────────

  private score(
    me: CandidateBundle,
    other: CandidateBundle,
    distanceKm: number | null,
  ): CompatibilityResult {
    // 1. Shared interests — 35 pts
    const myInterestIds = me.interests.map((i) => i.id);
    const otherSet = new Set(other.interests.map((i) => i.id));
    const shared = myInterestIds.filter((id) => otherSet.has(id));
    const denom = Math.max(1, Math.min(myInterestIds.length, other.interests.length));
    const interestPts = Math.round(35 * Math.min(1, shared.length / denom));

    // 2. Relationship goals — 25 pts
    const goalPts = this.goalScore(
      me.pref.intention,
      other.pref.intention,
    );

    // 3. Preferences (gender + age both directions) — 20 pts
    let prefPts = 0;
    if (
      me.pref.showMe === ShowMe.EVERYONE ||
      me.pref.showMe === (other.profile.gender as string)
    ) {
      prefPts += 5;
    }
    if (
      other.pref.showMe === ShowMe.EVERYONE ||
      other.pref.showMe === (me.profile.gender as string)
    ) {
      prefPts += 5;
    }
    const myAge = me.profile.dob ? ageFromDob(me.profile.dob) : null;
    const otherAge = other.profile.dob ? ageFromDob(other.profile.dob) : null;
    if (myAge !== null && myAge >= other.pref.ageMin && myAge <= other.pref.ageMax) prefPts += 5;
    if (otherAge !== null && otherAge >= me.pref.ageMin && otherAge <= me.pref.ageMax) prefPts += 5;

    // 4. Location — 10 pts
    let locationPts = 4; // neutral default when unknown
    if (distanceKm !== null) {
      if (
        me.profile.city &&
        other.profile.city &&
        me.profile.city.toLowerCase() === other.profile.city.toLowerCase()
      ) {
        locationPts = 10;
      } else if (distanceKm <= 10) locationPts = 9;
      else if (distanceKm <= me.pref.maxDistanceKm) {
        locationPts = Math.round(8 - (distanceKm / me.pref.maxDistanceKm) * 4);
      } else {
        locationPts = 3;
      }
    }

    // 5. Other factors — 10 pts (verified, bio, active)
    let otherPts = 0;
    if (other.profile.verification === VerificationStatus.VERIFIED) otherPts += 3;
    if (other.profile.bio && other.profile.bio.trim().length >= 20) otherPts += 4;
    const days = other.user.lastActiveAt
      ? (Date.now() - other.user.lastActiveAt.getTime()) / 86400000
      : 99;
    otherPts += days <= 7 ? 3 : days <= 30 ? 1 : 0;

    const score = clamp(
      interestPts + goalPts + prefPts + locationPts + otherPts,
      0,
      100,
    );

    const sharedInterests = shared
      .map((id) => me.interests.find((i) => i.id === id))
      .filter(Boolean) as Interest[];
    const reasons = this.explain(
      sharedInterests,
      me.pref.intention,
      other.pref.intention,
      distanceKm,
      other.profile,
    );
    const conversationStarters = this.starters(sharedInterests, other.profile);

    return {
      score,
      breakdown: [
        { label: 'Shared interests', points: interestPts, max: 35 },
        { label: 'Relationship goals', points: goalPts, max: 25 },
        { label: 'Dating preferences', points: prefPts, max: 20 },
        { label: 'Location', points: locationPts, max: 10 },
        { label: 'Profile & activity', points: otherPts, max: 10 },
      ],
      reasons,
      conversationStarters,
    };
  }

  private goalScore(a: RelationshipIntention, b: RelationshipIntention): number {
    if (a === b) return 25;
    const serious = [RelationshipIntention.LONG_TERM, RelationshipIntention.SERIOUS];
    if (serious.includes(a) && serious.includes(b)) return 20;
    if (
      (a === RelationshipIntention.FRIENDSHIP && b !== RelationshipIntention.CASUAL) ||
      (b === RelationshipIntention.FRIENDSHIP && a !== RelationshipIntention.CASUAL)
    ) {
      return 12;
    }
    if (
      (a === RelationshipIntention.CASUAL && serious.includes(b)) ||
      (b === RelationshipIntention.CASUAL && serious.includes(a))
    ) {
      return 5;
    }
    return 10;
  }

  /** Human-readable "why this match" explanation — the AI hook. */
  private explain(
    shared: Interest[],
    myGoal: RelationshipIntention,
    theirGoal: RelationshipIntention,
    distanceKm: number | null,
    theirProfile: Profile,
  ): string[] {
    const reasons: string[] = [];
    if (shared.length >= 3) {
      reasons.push(
        `You share ${shared.length} interests, including ${shared
          .slice(0, 3)
          .map((i) => i.name)
          .join(', ')}.`,
      );
    } else if (shared.length > 0) {
      reasons.push(`You both love ${shared.map((i) => i.name).join(' and ')}.`);
    }
    if (myGoal === theirGoal) {
      reasons.push(
        `You're both looking for ${this.goalLabel(myGoal).toLowerCase()}.`,
      );
    }
    if (distanceKm !== null && distanceKm <= 15) {
      reasons.push(
        distanceKm <= 2
          ? `You're practically neighbours in ${theirProfile.city}.`
          : `Only about ${Math.round(distanceKm)} km apart in ${theirProfile.city}.`,
      );
    } else if (theirProfile.city) {
      reasons.push(`Based in ${theirProfile.city}${theirProfile.country ? `, ${theirProfile.country}` : ''}.`);
    }
    if (theirProfile.verification === VerificationStatus.VERIFIED) {
      reasons.push('Verified profile — a genuine, trusted member.');
    }
    if (reasons.length === 0) reasons.push('Your profiles complement each other.');
    return reasons.slice(0, 4);
  }

  private starters(shared: Interest[], profile: Profile): string[] {
    const out: string[] = [];
    if (shared[0]) {
      out.push(
        `Hi ${profile.name?.split(' ')[0] ?? 'there'}! I saw you're into ${shared[0].name} — what got you started with it?`,
      );
    }
    if (shared[1]) {
      out.push(`If you could spend a perfect day doing ${shared[1].name.toLowerCase()}, what would it look like?`);
    }
    out.push('What does a perfect weekend look like for you?');
    return out.slice(0, 3);
  }

  goalLabel(g: RelationshipIntention): string {
    switch (g) {
      case RelationshipIntention.LONG_TERM:
        return 'A long-term relationship';
      case RelationshipIntention.SERIOUS:
        return 'Serious dating';
      case RelationshipIntention.FRIENDSHIP:
        return 'Friendship first';
      case RelationshipIntention.CASUAL:
        return 'Casual dating';
      default:
        return 'Still exploring';
    }
  }

  // ───────────────────────────── Helpers ───────────────────────────────

  private distanceBetween(a: Profile, b: Profile): number | null {
    if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) {
      return null;
    }
    return haversineKm(a.lat, a.lng, b.lat, b.lng);
  }

  private async bundleFor(
    userId: string,
    _me?: CandidateBundle,
  ): Promise<CandidateBundle | null> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) return null;
    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) return null;
    const [photos, prefRows, interestRows, settings] = await Promise.all([
      this.photos.find({
        where: { profileId: profile.id, active: true },
        order: { sortOrder: 'ASC' },
      }),
      this.preferences.find({ where: { userId } }),
      this.userInterests.find({ where: { userId }, relations: ['interest'] }),
      this.settings.findOne({ where: { userId } }),
    ]);
    let pref = prefRows[0];
    if (!pref) {
      pref = this.preferences.create({ userId });
      pref = await this.preferences.save(pref);
    }
    return {
      user,
      profile,
      photos,
      pref,
      interests: interestRows.map((r) => r.interest).filter(Boolean),
      settings,
    };
  }

  private toCard(
    b: CandidateBundle,
    comp: CompatibilityResult | null,
    distanceKm: number | null,
  ) {
    return {
      userId: b.user.id,
      profileId: b.profile.id,
      name: b.profile.name,
      age: b.profile.dob ? ageFromDob(b.profile.dob) : null,
      gender: b.profile.gender,
      bio: b.profile.bio,
      city: b.profile.city,
      country: b.profile.country,
      mainPhotoUrl: b.profile.mainPhotoUrl,
      photos: b.photos.map((p) => ({ id: p.id, url: p.url })),
      isVerified: b.profile.verification === VerificationStatus.VERIFIED,
      intention: b.pref.intention,
      intentionLabel: this.goalLabel(b.pref.intention),
      interests: b.interests.map((i) => ({ id: i.id, name: i.name, emoji: i.emoji })),
      compatibility: comp ? comp.score : null,
      compatibilityDetail: comp,
      distanceKm: distanceKm == null ? null : Math.round(distanceKm),
      lastActiveAt: b.user.lastActiveAt,
      isBoosted:
        !!b.profile.boostedUntil && b.profile.boostedUntil.getTime() > Date.now(),
    };
  }
}
