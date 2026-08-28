export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  status?: string;
}

export interface Interest {
  id: string;
  name: string;
  emoji?: string | null;
  category?: string;
}

export interface ProfileCard {
  userId: string;
  profileId: string;
  name: string;
  age: number | null;
  gender: string;
  bio: string | null;
  city: string | null;
  country: string | null;
  mainPhotoUrl: string | null;
  photos: { id: string; url: string }[];
  isVerified: boolean;
  intention?: string;
  intentionLabel?: string;
  interests: Interest[];
  compatibility: number | null;
  compatibilityDetail?: {
    score: number;
    breakdown: { label: string; points: number; max: number }[];
    reasons: string[];
    conversationStarters: string[];
  };
  distanceKm: number | null;
  lastActiveAt?: string | null;
  isBoosted?: boolean;
  blurred?: boolean;
  isSuperLike?: boolean;
}

export interface Conversation {
  id: string;
  matchId: string | null;
  other: ProfileCard;
  compatibility: number | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string | null;
  type: 'text' | 'image' | 'voice' | 'deleted' | string;
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
  attachments: {
    id: string;
    url: string;
    mime?: string | null;
    durationSec?: number | null;
  }[];
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export interface Entitlements {
  isPremium: boolean;
  tier: string;
  dailyLikeLimit: number;
  superLikesPerWeek: number;
  seeWhoLikesYou: boolean;
  advancedFilters: boolean;
  includesBoost: boolean;
  boostedUntil: string | null;
}
