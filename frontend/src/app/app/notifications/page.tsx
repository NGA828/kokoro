'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Users,
  MessageCircle,
  Heart,
  Star,
  Eye,
  Crown,
  BadgeCheck,
  CheckCheck,
} from 'lucide-react';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useSocket } from '@/lib/socket';
import { Button, EmptyState, Skeleton } from '@/components/ui';
import type { AppNotification } from '@/lib/types';

const ICONS: Record<string, { C: LucideIcon; color: string; bg: string }> = {
  match: { C: Users, color: '#ff3d8f', bg: 'rgba(255,61,143,0.15)' },
  message: { C: MessageCircle, color: '#8b4dff', bg: 'rgba(139,77,255,0.15)' },
  like: { C: Heart, color: '#ff3d8f', bg: 'rgba(255,61,143,0.15)' },
  superlike: { C: Star, color: '#38bdf8', bg: 'rgba(56,189,248,0.15)' },
  profile_view: { C: Eye, color: '#3dd6ff', bg: 'rgba(61,214,255,0.15)' },
  system: { C: Bell, color: '#a875ff', bg: 'rgba(168,117,255,0.15)' },
  premium: { C: Crown, color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  verification: { C: BadgeCheck, color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
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
      <div className="flex items-end justify-between mb-6">
        <h1 className="font-display text-3xl font-bold">Notifications</h1>
        <Button
          variant="ghost"
          className="!py-2 text-sm inline-flex items-center gap-1.5"
          onClick={() => {
            api.post('/notifications/read-all').then(() => load());
          }}
        >
          <CheckCheck size={15} /> Mark all read
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
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
              <span
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: (ICONS[n.type] ?? ICONS.system).bg,
                  color: (ICONS[n.type] ?? ICONS.system).color,
                }}
              >
                {(() => {
                  const C = (ICONS[n.type] ?? ICONS.system).C;
                  return <C size={20} />;
                })()}
              </span>
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
