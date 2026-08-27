'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/store';
import { setUnauthorizedHandler } from '@/lib/api';
import { SocketProvider } from '@/lib/socket';

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password'];

export function AppProviders({ children }: { children: React.ReactNode }) {
  const hydrate = useAuth((s) => s.hydrate);
  const logout = useAuth((s) => s.logout);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    hydrate();
    setUnauthorizedHandler(() => {
      logout();
    });
  }, [hydrate, logout]);

  const isAppArea =
    pathname.startsWith('/app') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/onboarding');

  return (
    <SocketProvider>
      {isAppArea ? (
        <RequireAuth pathname={pathname} router={router}>
          {children}
        </RequireAuth>
      ) : (
        children
      )}
    </SocketProvider>
  );
}

function RequireAuth({
  children,
  pathname,
  router,
}: {
  children: React.ReactNode;
  pathname: string;
  router: ReturnType<typeof useRouter>;
}) {
  const { user, loaded } = useAuth();
  useEffect(() => {
    if (loaded && !user) {
      router.replace('/login');
    }
    if (loaded && user && pathname.startsWith('/admin') && user.role !== 'admin') {
      router.replace('/app');
    }
  }, [loaded, user, pathname, router]);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-white/50">Loading Kokoro March…</div>
      </div>
    );
  }
  if (!user) return null;
  return <>{children}</>;
}
