'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, errMessage } from '@/lib/api';
import { useAuth } from '@/lib/store';
import { Heart, Info } from 'lucide-react';
import { Logo, Button, Spinner } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setSession(
        { accessToken: data.accessToken, refreshToken: data.refreshToken },
        data.user,
      );
      router.push(data.onboardingCompleted ? '/app' : '/onboarding');
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex relative items-center justify-center p-12 bg-radial-glow">
        <div className="max-w-md text-center">
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
            className="mb-6 inline-flex w-24 h-24 rounded-[28px] bg-brand-gradient shadow-glow items-center justify-center"
          >
            <Heart size={44} fill="currentColor" className="text-white" />
          </motion.div>
          <h2 className="font-display text-4xl font-bold mb-4">
            Welcome back to <span className="text-gradient">Kokoro March</span>
          </h2>
          <p className="text-white/60">
            Your conversations and matches are right where you left them.
          </p>
          <div className="mt-10 glass rounded-3xl p-6 text-left text-sm text-white/70 space-y-3">
            <p className="flex items-center gap-2"><Info size={14} className="text-rose-300" /> Try a demo account:</p>
            <p className="font-mono text-xs">
              vanessa@kokoro.test<br />amara@kokoro.test<br />
              password: <b>Password123</b>
            </p>
            <p className="font-mono text-xs">
              Admin: admin@kokoro.test / Admin123!
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:justify-start">
            <Logo href="/" size="lg" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">Log in</h1>
          <p className="text-white/60 mb-8">
            New here?{' '}
            <Link href="/register" className="text-rose-400 hover:underline">
              Create an account
            </Link>
          </p>
          <form onSubmit={submit} className="space-y-5">
            {error && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-rose-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Button type="submit" disabled={loading} className="w-full !py-3.5">
              {loading ? <Spinner /> : 'Log in'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
