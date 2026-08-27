'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Compass,
  Heart,
  Users,
  MessageCircle,
  Bell,
  Crown,
  User,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/store';
import { useSocket } from '@/lib/socket';
import { Logo, Avatar } from '@/components/ui';
import { Mascot3D } from '@/components/Mascot3D';

const NAV = [
  { href: '/app', label: 'Dashboard', icon: Home },
  { href: '/app/discover', label: 'Discover', icon: Compass },
  { href: '/app/likes', label: 'Likes', icon: Heart },
  { href: '/app/matches', label: 'Matches', icon: Users },
  { href: '/app/messages', label: 'Messages', icon: MessageCircle },
  { href: '/app/notifications', label: 'Notifications', icon: Bell },
  { href: '/app/premium', label: 'Premium', icon: Crown },
  { href: '/app/profile', label: 'Profile', icon: User },
  { href: '/app/settings', label: 'Settings', icon: Settings },
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

  // Mobile: 5 slots with Messages as the raised center FAB
  const mobileTabs = [
    { href: '/app', icon: Home, label: 'Home' },
    { href: '/app/likes', icon: Heart, label: 'Likes' },
    { href: '/app/messages', icon: MessageCircle, label: 'Messages', center: true },
    { href: '/app/matches', icon: Users, label: 'Matches' },
    { href: '/app/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[270px_1fr]">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex flex-col border-r border-white/10 bg-ink-900/60 backdrop-blur-xl sticky top-0 h-screen px-4 py-6">
        <div className="px-2 mb-8">
          <Logo href="/app" size="sm" />
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            const badge = badgeFor(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition relative ${
                  isActive(n.href)
                    ? 'bg-brand-gradient text-white shadow-glow'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={19} strokeWidth={isActive(n.href) ? 2.4 : 2} />
                {n.label}
                {badge > 0 && (
                  <span className="ml-auto bg-rose-500 text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-amber-300 hover:bg-white/5 transition"
            >
              <ShieldCheck size={19} />
              Admin console
            </Link>
          )}
        </nav>
        <div className="space-y-2 border-t border-white/10 pt-4">
          <Link
            href="/app/premium"
            className="flex items-center gap-2 justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-amber-300 border border-amber-400/30 bg-amber-500/10 hover:bg-amber-500/20 transition"
          >
            <Crown size={17} /> Go Premium
          </Link>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition"
          >
            <LogOut size={19} /> Log out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="pb-28 lg:pb-12 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 lg:pt-8 lg:py-10">
          {children}
        </div>
      </main>

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 glass-strong px-4 py-3 flex items-center justify-between">
        <Logo href="/app" size="sm" />
        <div className="flex items-center gap-3">
          <Link
            href="/app/premium"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 border border-amber-400/30 rounded-full px-3 py-1.5 bg-amber-500/10"
          >
            <Crown size={13} /> Premium
          </Link>
          <Link href="/app/notifications" className="relative text-white/80">
            <Bell size={22} />
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                {unread}
              </span>
            )}
          </Link>
          <Link href="/app/profile">
            <Avatar src={photo} name={user?.name || 'U'} size={34} />
          </Link>
        </div>
      </div>

      {/* ── Mobile floating tab bar ── */}
      <nav className="lg:hidden fixed bottom-4 inset-x-4 z-40">
        <div className="glass-strong rounded-full border border-white/15 shadow-card px-3 py-2 grid grid-cols-5 items-center">
          {mobileTabs.map((n) => {
            const Icon = n.icon;
            const active = isActive(n.href);
            const badge = badgeFor(n.href);
            if (n.center) {
              return (
                <div key={n.href} className="flex justify-center">
                  <Link
                    href={n.href}
                    className="w-14 h-14 -mt-8 rounded-full bg-brand-gradient flex items-center justify-center text-white shadow-glow border-4 border-ink-900 active:scale-90 transition-transform relative"
                    aria-label={n.label}
                  >
                    <Icon size={24} fill={active ? 'currentColor' : 'none'} />
                    {badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-white text-rose-500 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center border-2 border-ink-900">
                        {badge}
                      </span>
                    )}
                  </Link>
                </div>
              );
            }
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`relative flex flex-col items-center gap-0.5 py-1 transition ${
                  active ? 'text-rose-400' : 'text-white/50'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} fill={active && n.href === '/app/likes' ? 'currentColor' : 'none'} />
                {badge > 0 && (
                  <span className="absolute top-0 right-2 bg-rose-500 text-white text-[8px] font-bold rounded-full min-w-[14px] h-3.5 px-1 flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <Mascot3D />
    </div>
  );
}
