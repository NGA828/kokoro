'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/store';
import {
  Avatar,
  Badge,
  EmptyState,
  PageHeader,
  Photo,
  Skeleton,
  VerifiedBadge,
} from '@/components/ui';
import type { Conversation, ProfileCard } from '@/lib/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{
    completion: number;
    mainPhotoUrl: string | null;
    onboardingCompleted: boolean;
  } | null>(null);
  const [suggested, setSuggested] = useState<ProfileCard[]>([]);
  const [matches, setMatches] = useState<ProfileCard[]>([]);
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/profiles/me'),
      api.get('/discover?limit=6'),
      api.get('/matches'),
      api.get('/conversations'),
    ])
      .then(([p, d, m, c]) => {
        setProfile(p.data);
        setSuggested(d.data.items ?? []);
        setMatches((m.data as { other: ProfileCard }[]).map((x) => x.other).slice(0, 6));
        setConvs(c.data ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="pt-14 lg:pt-0">
      <PageHeader
        title={`Welcome back, ${firstName} 💕`}
        subtitle="Your Kokoro March world at a glance."
      />

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Profile completion */}
          {profile && profile.completion < 100 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6 flex flex-col sm:flex-row items-center gap-5"
            >
              <Avatar src={profile.mainPhotoUrl} name={user?.name ?? 'U'} size={72} />
              <div className="flex-1 w-full">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Complete your profile</span>
                  <span className="text-rose-300 font-bold">
                    {profile.completion}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${profile.completion}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full bg-brand-gradient rounded-full"
                  />
                </div>
                <p className="text-sm text-white/50 mt-2">
                  A complete profile gets up to 5× more matches.
                </p>
              </div>
              <Link href="/app/profile" className="btn-primary !py-2.5 whitespace-nowrap">
                Edit profile
              </Link>
            </motion.div>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Suggested', value: suggested.length, icon: '🔥', href: '/app/discover' },
              { label: 'Matches', value: matches.length, icon: '💞', href: '/app/matches' },
              { label: 'Messages', value: convs.length, icon: '💬', href: '/app/messages' },
              { label: 'Likes', value: 'You', icon: '❤️', href: '/app/likes' },
            ].map((s) => (
              <Link key={s.label} href={s.href} className="card p-5 hover:border-rose-400/30 transition">
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="font-display text-2xl font-bold">
                  {s.value}
                </div>
                <div className="text-sm text-white/50">{s.label}</div>
              </Link>
            ))}
          </div>

          {/* Suggested matches */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-bold">
                Suggested for you
              </h2>
              <Link href="/app/discover" className="text-sm text-rose-400 hover:underline">
                See all →
              </Link>
            </div>
            {suggested.length === 0 ? (
              <EmptyState
                icon="🧭"
                title="No new profiles right now"
                body="Check back soon — new members join Kokoro March every day."
              />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {suggested.slice(0, 6).map((p, i) => (
                  <motion.div
                    key={p.userId}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={`/app/discover?u=${p.userId}`}
                      className="block rounded-3xl overflow-hidden relative aspect-[3/4] group"
                    >
                      <Photo src={p.mainPhotoUrl} alt={p.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3">
                        <Badge tone="blur">
                          {p.compatibility ? `${p.compatibility}% Match` : 'New'}
                        </Badge>
                      </div>
                      <div className="absolute bottom-0 p-4 w-full">
                        <div className="font-semibold flex items-center gap-1.5">
                          {p.name}, {p.age}
                          {p.isVerified && <VerifiedBadge />}
                        </div>
                        <div className="text-xs text-white/70">
                          {p.city}
                          {p.distanceKm != null && ` · ${p.distanceKm} km`}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Recent conversations */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-bold">Recent conversations</h2>
              <Link href="/app/messages" className="text-sm text-rose-400 hover:underline">
                Open messages →
              </Link>
            </div>
            {convs.length === 0 ? (
              <EmptyState
                icon="💌"
                title="No conversations yet"
                body="Your conversations will appear here when you make a connection. Keep discovering — your next match could be around the corner. ❤️"
                action={
                  <Link href="/app/discover" className="btn-primary">
                    Discover people
                  </Link>
                }
              />
            ) : (
              <div className="card divide-y divide-white/5">
                {convs.slice(0, 5).map((c) => (
                  <Link
                    key={c.id}
                    href={`/app/messages/${c.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-white/5 transition"
                  >
                    <Avatar src={c.other.mainPhotoUrl} name={c.other.name} size={52} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold flex items-center gap-2">
                        {c.other.name}
                        {c.other.isVerified && <VerifiedBadge className="w-4 h-4 text-[9px]" />}
                      </div>
                      <div className="text-sm text-white/50 truncate">
                        {c.lastMessagePreview ?? 'Say hello 👋'}
                      </div>
                    </div>
                    {c.unreadCount > 0 && (
                      <span className="bg-rose-500 text-white text-xs font-bold rounded-full min-w-6 h-6 px-2 flex items-center justify-center">
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
