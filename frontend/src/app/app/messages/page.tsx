'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Avatar, EmptyState, PageHeader, Skeleton, VerifiedBadge } from '@/components/ui';
import type { Conversation } from '@/lib/types';

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function MessagesPage() {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  function load() {
    api
      .get('/conversations')
      .then(({ data }) => setConvs(data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(
    () =>
      convs.filter((c) =>
        c.other.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [convs, search],
  );

  return (
    <div className="pt-14 lg:pt-0 max-w-2xl mx-auto">
      <PageHeader title="Messages 💬" subtitle="Your matches, one tap away." />
      <input
        className="input mb-5"
        placeholder="Search conversations…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="💬"
          title="Your conversations will appear here"
          body="When you make a connection, your conversations will live here. Go discover someone amazing."
          action={
            <Link href="/app/discover" className="btn-primary">
              Discover people
            </Link>
          }
        />
      ) : (
        <div className="card divide-y divide-white/5 overflow-hidden">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/app/messages/${c.id}`}
              className="flex items-center gap-4 p-4 hover:bg-white/5 transition"
            >
              <Avatar src={c.other.mainPhotoUrl} name={c.other.name} size={56} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold flex items-center gap-1.5">
                  {c.other.name}
                  {c.other.isVerified && (
                    <VerifiedBadge className="w-4 h-4 text-[9px]" />
                  )}
                  <span className="ml-auto text-xs text-white/40">
                    {timeAgo(c.lastMessageAt)}
                  </span>
                </div>
                <div
                  className={`text-sm truncate ${
                    c.unreadCount ? 'text-white font-medium' : 'text-white/50'
                  }`}
                >
                  {c.lastMessagePreview ?? 'Say hello 👋'}
                </div>
              </div>
              {c.unreadCount > 0 && (
                <span className="bg-brand-gradient text-white text-xs font-bold rounded-full min-w-6 h-6 px-2 flex items-center justify-center shadow-glow">
                  {c.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
