'use client';

import { Users, Star, Heart, MessageCircle } from 'lucide-react';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { EmptyState, Photo, Skeleton, VerifiedBadge } from '@/components/ui';

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
      <h1 className="font-display text-3xl font-bold mb-5">Matches</h1>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-3xl" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No matches yet"
          body="Keep discovering — your next connection could be just around the corner."
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
                className="block rounded-3xl overflow-hidden relative aspect-[3/4] group"
              >
                <Photo src={m.other.mainPhotoUrl} alt={m.other.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-950/10 to-transparent" />
                {m.isSuper && (
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-sky-500/90 text-white text-[11px] font-bold px-2.5 py-1 backdrop-blur">
                    <Star size={11} fill="currentColor" /> Super
                  </span>
                )}
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-rose-500/90 text-white text-[11px] font-bold px-2.5 py-1 backdrop-blur shadow-glow">
                  <Heart size={10} fill="currentColor" /> {m.compatibility}%
                </span>
                <div className="absolute bottom-0 p-4 w-full">
                  <div className="font-semibold flex items-center gap-1.5">
                    {m.other.name}
                    {m.other.isVerified && <VerifiedBadge className="w-4 h-4" />}
                  </div>
                  <div className="text-xs text-white/60 truncate flex items-center gap-1.5 mt-0.5">
                    {m.lastMessagePreview ? (
                      m.lastMessagePreview
                    ) : (
                      <>
                        <MessageCircle size={11} className="text-rose-300" /> Tap to say hello
                      </>
                    )}
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
