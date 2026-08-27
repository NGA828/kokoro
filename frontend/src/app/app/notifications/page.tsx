'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useSocket } from '@/lib/socket';
import { Button, EmptyState, PageHeader, Skeleton } from '@/components/ui';
import type { AppNotification } from '@/lib/types';

const ICONS: Record<string, string> = {
  match: '💞',
  message: '💬',
  like: '❤️',
  superlike: '🌟',
  profile_view: '👀',
  system: '🔔',
  premium: '⭐',
  verification: '✅',
};

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { socket } = useSocket();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api
      .get('/notifications')
      .then(({ data }) => setItems(data.items ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    if (!socket) return;
    const onNotif = (n: AppNotification) => setItems((p) => [n, ...p]);
    socket.on('notification', onNotif);
    return () => {
      socket.off('notification', onNotif);
    };
  }, [socket]);

  function handleClick(n: AppNotification) {
    api.patch(`/notifications/${n.id}/read`).catch(() => {});
    setItems((p) => p.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    const data = n.data as { conversationId?: string; fromUserId?: string } | null;
    if (data?.conversationId) router.push(`/app/messages/${data.conversationId}`);
    else if (n.type === 'match' || n.type === 'message') router.push('/app/matches');
    else if (n.type === 'like' || n.type === 'superlike') router.push('/app/likes');
    else if (data?.fromUserId) router.push(`/app/discover?u=${data.fromUserId}`);
  }

  return (
    <div className="pt-14 lg:pt-0 max-w-2xl mx-auto">
      <PageHeader
        title="Notifications 🔔"
        action={
          <Button
            variant="ghost"
            className="!py-2 text-sm"
            onClick={() => {
              api.post('/notifications/read-all').then(() => load());
            }}
          >
            Mark all read
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No notifications yet"
          body="When something exciting happens — a match, a like, a message — you will find it here."
        />
      ) : (
        <div className="space-y-2">
          {items.map((n, i) => (
            <motion.button
              key={n.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              onClick={() => handleClick(n)}
              className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl transition ${
                n.isRead ? 'bg-white/[0.03]' : 'bg-brand-gradient-soft border border-rose-400/20'
              } hover:bg-white/[0.07]`}
            >
              <span className="text-2xl shrink-0">{ICONS[n.type] ?? '🔔'}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{n.title}</div>
                {n.body && <div className="text-sm text-white/60 truncate">{n.body}</div>}
              </div>
              <span className="text-xs text-white/40 shrink-0">{timeAgo(n.createdAt)}</span>
              {!n.isRead && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
