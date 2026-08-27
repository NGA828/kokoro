'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui';

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/reports', label: 'Reports', icon: '🚨' },
  { href: '/admin/verifications', label: 'Verifications', icon: '✅' },
  { href: '/admin/payments', label: 'Payments', icon: '💳' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:flex flex-col border-r border-white/10 bg-ink-900/60 sticky top-0 h-screen p-5">
        <div className="px-2 py-2 mb-6">
          <Logo href="/admin" size="sm" />
          <div className="text-xs text-amber-300 mt-1 font-semibold">
            🛡️ Admin console
          </div>
        </div>
        <nav className="space-y-1 flex-1">
          {ADMIN_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition ${
                pathname === n.href
                  ? 'bg-brand-gradient text-white'
                  : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <span>{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/app"
          className="px-4 py-3 rounded-2xl text-sm text-white/60 hover:text-white"
        >
          ← Back to app
        </Link>
      </aside>
      <main className="pb-24 lg:pb-10">
        <div className="lg:hidden glass-strong px-4 py-3 flex items-center justify-between sticky top-0 z-40">
          <Logo href="/admin" size="sm" />
          <Link href="/app" className="text-sm text-white/60">← App</Link>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-10">
          {children}
        </div>
        <nav className="lg:hidden fixed bottom-0 inset-x-0 glass-strong grid grid-cols-5 border-t border-white/10">
          {ADMIN_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex flex-col items-center py-2 text-[10px] ${
                pathname === n.href ? 'text-rose-400' : 'text-white/50'
              }`}
            >
              <span className="text-lg">{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
