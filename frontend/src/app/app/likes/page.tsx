'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import {
  Avatar,
  Badge,
  EmptyState,
  PageHeader,
  Photo,
  Skeleton,
} from '@/components/ui';
import type { ProfileCard } from '@/lib/types';

type Tab = 'received' | 'sent';

export default function LikesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('received');
  const [received, setReceived] = useState<(ProfileCard & { likedAt?: string })[]>([]);
  const [sent, setSent] = useState<ProfileCard[]>([]);
  const [total, setTotal] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/likes/received'), api.get('/likes/sent')])
      .then(([r, s]) => {
        setReceived(r.data.items ?? []);
        setTotal(r.data.totalCount ?? 0);
        setIsPremium(r.data.isPremium);
        setSent(s.data.items ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const items = tab === 'received' ? received : sent;

  return (
    <div className="pt-14 lg:pt-0">
      <PageHeader
        title="Likes ❤️"
        subtitle="People who are interested in you — and those you’ve liked."
      />

      {!isPremium && received.length > 0 && (
        <div className="card p-5 mb-6 flex items-center gap-4 bg-brand-gradient-soft border-rose-400/30">
          <span className="text-3xl">⭐</span>
          <div className="flex-1">
            <div className="font-semibold">See everyone who likes you</div>
            <div className="text-sm text-white/60">
              {total} people liked you — Premium reveals them all.
            </div>
          </div>
          <button
            onClick={() => router.push('/app/premium')}
            className="btn-primary !py-2.5 !px-5 whitespace-nowrap"
          >
            Upgrade
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {(['received', 'sent'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
              tab === t
                ? 'bg-brand-gradient text-white shadow-glow'
                : 'bg-white/5 border border-white/10 text-white/60'
            }`}
          >
            {t === 'received' ? 'Liked you' : 'You liked'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={tab === 'received' ? '💌' : '❤️'}
          title={tab === 'received' ? 'No likes yet' : 'You haven’t liked anyone yet'}
          body={
            tab === 'received'
              ? 'As you discover people and they discover you, new likes will show up here.'
              : 'Head to Discover and start connecting — your next match could be one tap away.'
          }
          action={
            <Link href="/app/discover" className="btn-primary">
              Discover people
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((p, i) => (
            <motion.div
              key={p.userId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="relative rounded-3xl overflow-hidden aspect-[3/4] group"
            >
              <Photo src={p.mainPhotoUrl} alt={p.name} blur={!!(p as ProfileCard & { blurred?: boolean }).blurred} />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 to-transparent" />
              <div className="absolute top-3 left-3 flex gap-1.5">
                {p.isSuperLike && <Badge tone="gold">🌟</Badge>}
                {p.compatibility != null && !p.blurred && (
                  <Badge tone="blur">{p.compatibility}%</Badge>
                )}
              </div>
              <div className="absolute bottom-0 p-3 w-full">
                {p.blurred ? (
                  <div className="font-semibold">Someone likes you 🔒</div>
                ) : (
                  <Link href={`/app/discover?u=${p.userId}`}>
                    <div className="font-semibold flex items-center gap-1">
                      {p.name}, {p.age}
                    </div>
                    <div className="text-xs text-white/60">{p.city}</div>
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
