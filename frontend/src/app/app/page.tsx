'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Heart,
  Users,
  Eye,
  MessageCircle,
  Compass,
  Mail,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { api, mediaUrl } from '@/lib/api';
import { useAuth } from '@/lib/store';
import { EmptyState, Skeleton, VerifiedBadge } from '@/components/ui';
import type { Conversation, ProfileCard } from '@/lib/types';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function StatTile({
  label,
  value,
  icon: Icon,
  color,
  href,
  delay,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  href: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Link
        href={href}
        className="block rounded-3xl bg-white/[0.04] border border-white/10 p-5 hover:border-white/25 hover:bg-white/[0.06] transition group"
      >
        <div className="flex items-start justify-between">
          <span
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: `${color}22`, color }}
          >
            <Icon size={19} />
          </span>
          <ChevronRight
            size={16}
            className="text-white/20 group-hover:text-white/60 transition -mr-1"
          />
        </div>
        <div className="font-display text-3xl font-bold mt-4">{value}</div>
        <div className="text-sm text-white/50">{label}</div>
      </Link>
    </motion.div>
  );
}

function PersonCard({ p, i }: { p: ProfileCard; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + i * 0.06 }}
    >
      <Link
        href={`/app/discover?u=${p.userId}`}
        className="block rounded-3xl overflow-hidden relative aspect-[3/4] group"
      >
        {p.mainPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(p.mainPhotoUrl)}
            alt={p.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-brand-gradient" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-950/10 to-transparent" />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-rose-500/90 text-white text-[11px] font-bold px-2.5 py-1 backdrop-blur">
          {p.compatibility ? (<><Heart size={10} fill="currentColor" /> {p.compatibility}%</>) : 'New'}
        </span>
        <div className="absolute bottom-0 p-3.5 w-full">
          <div className="font-semibold text-[15px] flex items-center gap-1">
            {p.name}, {p.age}
            {p.isVerified && <VerifiedBadge className="w-4 h-4" />}
          </div>
          <div className="text-xs text-white/70 truncate">{p.city}</div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{
    completion: number;
    mainPhotoUrl: string | null;
    onboardingCompleted: boolean;
  } | null>(null);
  const [suggested, setSuggested] = useState<ProfileCard[]>([]);
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/profiles/me'),
      api.get('/discover?limit=6'),
      api.get('/matches'),
      api.get('/conversations'),
      api.get('/likes/received').catch(() => ({ data: { totalCount: 0 } })),
    ])
      .then(([p, d, m, c, l]) => {
        setProfile(p.data);
        setSuggested(d.data.items ?? []);
        setMatchCount((m.data as unknown[]).length);
        setConvs(c.data ?? []);
        setLikeCount((l.data as { totalCount?: number }).totalCount ?? 0);
      })
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="pt-14 lg:pt-0">
      <div className="flex items-start justify-between gap-4 mb-7">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {greeting()}, {firstName}
          </h1>
          <p className="text-white/55 mt-1">Ready to find your special someone?</p>
        </div>
        <Sparkles className="text-amber-300 mt-1 shrink-0" size={26} />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-9">
          {profile && profile.completion < 100 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-brand-gradient-soft border border-rose-400/25 p-5 flex flex-col sm:flex-row items-center gap-4"
            >
              <span className="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center text-white shrink-0">
                <Sparkles size={22} />
              </span>
              <div className="flex-1 w-full">
                <div className="flex justify-between mb-1.5 text-sm">
                  <span className="font-semibold">Complete your profile</span>
                  <span className="text-rose-300 font-bold">{profile.completion}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${profile.completion}%` }}
                    transition={{ duration: 0.9 }}
                    className="h-full bg-brand-gradient rounded-full"
                  />
                </div>
              </div>
              <Link href="/app/profile" className="btn-primary !py-2.5 whitespace-nowrap text-sm">
                Edit profile
              </Link>
            </motion.div>
          )}

          {/* Stats overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile label="Likes" value={likeCount} icon={Heart} color="#ff3d8f" href="/app/likes" delay={0} />
            <StatTile label="Matches" value={matchCount} icon={Users} color="#c92bb0" href="/app/matches" delay={0.05} />
            <StatTile label="Profile views" value={suggested.length ? '—' : 0} icon={Eye} color="#3dd6ff" href="/app/discover" delay={0.1} />
            <StatTile label="Messages" value={convs.length} icon={MessageCircle} color="#8b4dff" href="/app/messages" delay={0.15} />
          </div>

          {/* Recommended people */}
          <section>
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="font-display text-2xl font-bold">Recommended for you</h2>
                <p className="text-white/50 text-sm">Based on your preferences and activity</p>
              </div>
              <Link
                href="/app/discover"
                className="text-sm text-rose-400 hover:underline shrink-0 inline-flex items-center"
              >
                View all <ChevronRight size={15} />
              </Link>
            </div>
            {suggested.length === 0 ? (
              <EmptyState
                icon={Compass}
                title="No new profiles right now"
                body="Check back soon — new members join Kokoro March every day."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {suggested.slice(0, 4).map((p, i) => (
                  <PersonCard key={p.userId} p={p} i={i} />
                ))}
              </div>
            )}
          </section>

          {/* Recent conversations */}
          <section>
            <div className="flex items-end justify-between mb-4">
              <h2 className="font-display text-2xl font-bold">Recent conversations</h2>
              <Link
                href="/app/messages"
                className="text-sm text-rose-400 hover:underline shrink-0 inline-flex items-center"
              >
                See all <ChevronRight size={15} />
              </Link>
            </div>
            {convs.length === 0 ? (
              <EmptyState
                icon={Mail}
                title="No conversations yet"
                body="When you match with someone, your conversations will appear here."
                action={
                  <Link href="/app/discover" className="btn-primary">
                    Discover people
                  </Link>
                }
              />
            ) : (
              <div className="rounded-3xl bg-white/[0.03] border border-white/10 divide-y divide-white/5 overflow-hidden">
                {convs.slice(0, 5).map((c) => (
                  <Link
                    key={c.id}
                    href={`/app/messages/${c.id}`}
                    className="flex items-center gap-3.5 p-3.5 hover:bg-white/5 transition"
                  >
                    {c.other.mainPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mediaUrl(c.other.mainPhotoUrl)}
                        alt={c.other.name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10 shrink-0"
                      />
                    ) : (
                      <span className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold shrink-0">
                        {c.other.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold flex items-center gap-1.5 text-[15px]">
                        {c.other.name}
                        {c.other.isVerified && <VerifiedBadge className="w-4 h-4" />}
                      </div>
                      <div className="text-sm text-white/45 truncate">
                        {c.lastMessagePreview ?? 'Say hello…'}
                      </div>
                    </div>
                    {c.unreadCount > 0 && (
                      <span className="bg-brand-gradient text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-glow">
                        {c.unreadCount}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
