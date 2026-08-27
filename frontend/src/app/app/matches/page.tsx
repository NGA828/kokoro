'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { EmptyState, PageHeader, Photo, Skeleton, VerifiedBadge } from '@/components/ui';

interface MatchRow {
  id: string;
  conversationId: string | null;
  compatibility: number;
  isSuper: boolean;
  createdAt: string;
  other: {
    userId: string;
    name: string;
    age: number | null;
    city: string | null;
    mainPhotoUrl: string | null;
    isVerified: boolean;
  };
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/matches')
      .then(({ data }) => setMatches(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pt-14 lg:pt-0">
      <PageHeader
        title="Matches 💞"
        subtitle="Mutual feelings — say hello before the moment passes."
      />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4]" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <EmptyState
          icon="💞"
          title="No matches yet"
          body="No matches yet. Keep discovering — your next connection could be around the corner. ❤️"
          action={
            <Link href="/app/discover" className="btn-primary">
              Start discovering
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {matches.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={
                  m.conversationId
                    ? `/app/messages/${m.conversationId}`
                    : `/app/discover?u=${m.other.userId}`
                }
                className="block rounded-3xl overflow-hidden relative aspect-[3/4]"
              >
                <Photo src={m.other.mainPhotoUrl} alt={m.other.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-950/10 to-transparent" />
                {m.isSuper && (
                  <div className="absolute top-3 left-3 chip bg-amber-500/30 border-amber-400/40 text-amber-200 text-xs backdrop-blur">
                    🌟 Super
                  </div>
                )}
                <div className="absolute top-3 right-3 chip bg-rose-500/30 border-rose-400/40 text-white text-xs backdrop-blur">
                  {m.compatibility}%
                </div>
                <div className="absolute bottom-0 p-4 w-full">
                  <div className="font-semibold flex items-center gap-1.5">
                    {m.other.name}
                    {m.other.isVerified && <VerifiedBadge className="w-4 h-4 text-[9px]" />}
                  </div>
                  <div className="text-xs text-white/60 truncate">
                    {m.lastMessagePreview ?? 'Tap to say hello 👋'}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
