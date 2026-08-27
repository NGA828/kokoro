'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/store';
import { useSocket } from '@/lib/socket';
import { Logo, Avatar } from '@/components/ui';

const NAV = [
  { href: '/app', label: 'Dashboard', icon: '🏠' },
  { href: '/app/discover', label: 'Discover', icon: '🔥' },
  { href: '/app/likes', label: 'Likes', icon: '❤️' },
  { href: '/app/matches', label: 'Matches', icon: '💞' },
  { href: '/app/messages', label: 'Messages', icon: '💬' },
  { href: '/app/notifications', label: 'Notifications', icon: '🔔' },
  { href: '/app/premium', label: 'Premium', icon: '⭐' },
  { href: '/app/profile', label: 'Profile', icon: '👤' },
  { href: '/app/settings', label: 'Settings', icon: '⚙️' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const [unread, setUnread] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [photo, setPhoto] = useState<string | null>(null);

  async function loadBadges() {
    try {
      const [{ data: notifs }, { data: convs }] = await Promise.all([
        api.get('/notifications'),
        api.get('/conversations'),
      ]);
      setUnread(notifs.unread ?? 0);
      setUnreadMessages(
        (convs as { unreadCount: number }[]).reduce(
          (a, c) => a + (c.unreadCount || 0),
          0,
        ),
      );
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    loadBadges();
    api.get('/profiles/me').then(({ data }) => setPhoto(data.mainPhotoUrl)).catch(() => {});
  }, [pathname]);

  useEffect(() => {
    if (!socket) return;
    const onNotif = () => {
      setUnread((n) => n + 1);
      loadBadges();
    };
    const onMessage = () => loadBadges();
    const onRead = () => loadBadges();
    socket.on('notification', onNotif);
    socket.on('message:new', onMessage);
    socket.on('message:read', onRead);
    return () => {
      socket.off('notification', onNotif);
      socket.off('message:new', onMessage);
      socket.off('message:read', onRead);
    };
  }, [socket]);

  function isActive(href: string) {
    return href === '/app' ? pathname === '/app' : pathname.startsWith(href);
  }

  const badgeFor = (href: string) => {
    if (href === '/app/notifications' && unread) return unread;
    if (href === '/app/messages' && unreadMessages) return unreadMessages;
    return 0;
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col border-r border-white/10 bg-ink-900/60 backdrop-blur-xl sticky top-0 h-screen p-5">
        <div className="px-2 py-2 mb-6">
          <Logo href="/app" size="sm" />
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition relative ${
                isActive(n.href)
                  ? 'bg-brand-gradient text-white shadow-glow'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-lg">{n.icon}</span>
              {n.label}
              {badgeFor(n.href) > 0 && (
                <span className="ml-auto bg-white text-ink-900 text-xs font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                  {badgeFor(n.href)}
                </span>
              )}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-amber-300 hover:bg-white/5 transition"
            >
              <span className="text-lg">🛡️</span>
              Admin
            </Link>
          )}
        </nav>
        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition"
        >
          <span className="text-lg">🚪</span> Log out
        </button>
      </aside>

      {/* Main */}
      <main className="pb-24 lg:pb-10 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-10">
          {children}
        </div>
      </main>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 glass-strong px-4 py-3 flex items-center justify-between">
        <Logo href="/app" size="sm" />
        <Link href="/app/profile">
          <Avatar src={photo} name={user?.name || 'U'} size={36} />
        </Link>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass-strong border-t border-white/10">
        <div className="grid grid-cols-5">
          {[
            NAV[0],
            NAV[1],
            NAV[3],
            NAV[4],
            NAV[7],
          ].map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] relative ${
                isActive(n.href) ? 'text-rose-400' : 'text-white/50'
              }`}
            >
              <span className="text-xl">{n.icon}</span>
              {n.label}
              {badgeFor(n.href) > 0 && (
                <span className="absolute top-1 right-1/2 translate-x-4 bg-rose-500 text-white text-[9px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                  {badgeFor(n.href)}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
