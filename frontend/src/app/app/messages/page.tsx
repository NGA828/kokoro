'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, MessageCircle, Mic, Image as ImageIcon } from 'lucide-react';
import { api, mediaUrl } from '@/lib/api';
import { EmptyState, Skeleton, VerifiedBadge } from '@/components/ui';
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

function RowAvatar({ c }: { c: Conversation }) {
  if (c.other.mainPhotoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={mediaUrl(c.other.mainPhotoUrl)}
        alt={c.other.name}
        className="w-14 h-14 rounded-full object-cover ring-2 ring-white/10"
      />
    );
  }
  return (
    <div className="w-14 h-14 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold text-lg ring-2 ring-white/10">
      {c.other.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
    </div>
  );
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
      <h1 className="font-display text-3xl font-bold mb-5">Messages</h1>

      <div className="relative mb-5">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          className="input !pl-11 !rounded-full !bg-white/5 border-white/10"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="Your conversations will appear here"
          body="When you make a connection, your conversations will live here. Go discover someone amazing."
          action={
            <Link href="/app/discover" className="btn-primary">
              Discover people
            </Link>
          }
        />
      ) : (
        <div className="space-y-1">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/app/messages/${c.id}`}
              className="flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-white/5 transition group"
            >
              <div className="relative shrink-0">
                <RowAvatar c={c} />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-ink-900" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold flex items-center gap-1.5 text-[15px]">
                  {c.other.name}
                  {c.other.isVerified && <VerifiedBadge className="w-4 h-4" />}
                </div>
                <div
                  className={`text-sm truncate flex items-center gap-1.5 ${
                    c.unreadCount ? 'text-white font-medium' : 'text-white/45'
                  }`}
                >
                  {c.lastMessagePreview?.startsWith('[Photo]') ? (
                    <>
                      <ImageIcon size={13} /> Sent a photo
                    </>
                  ) : c.lastMessagePreview?.startsWith('[Voice]') ? (
                    <>
                      <Mic size={13} /> Voice note
                    </>
                  ) : (
                    c.lastMessagePreview ?? 'Say hello…'
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-xs text-white/40">{timeAgo(c.lastMessageAt)}</span>
                {c.unreadCount > 0 && (
                  <span className="bg-brand-gradient text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center shadow-glow">
                    {c.unreadCount}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
