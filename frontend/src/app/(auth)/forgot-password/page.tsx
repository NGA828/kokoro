'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, errMessage } from '@/lib/api';
import { Logo, Button, Spinner } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSent(true);
      if (data.devToken) setDevToken(data.devToken);
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function doReset(e: React.FormEvent) {
    e.preventDefault();
    if (!devToken) return;
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token: devToken,
        password: newPassword,
      });
      setDone(true);
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-radial-glow">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo href="/" size="lg" />
        </div>
        <div className="card p-8 sm:p-10">
          <h1 className="font-display text-3xl font-bold mb-2">Reset password</h1>
          {done ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">🔑</div>
              <p className="text-white/70 mb-6">
                Your password has been reset. You can now log in with your new
                password.
              </p>
              <Link href="/login" className="btn-primary inline-flex">
                Back to login
              </Link>
            </div>
          ) : !sent ? (
            <form onSubmit={requestReset} className="space-y-5">
              <p className="text-white/60 text-sm">
                Enter your email and we will send you a reset link.
              </p>
              {error && (
                <div className="rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 text-sm">
                  {error}
                </div>
              )}
              <input
                type="email"
                required
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Spinner /> : 'Send reset link'}
              </Button>
            </form>
          ) : (
            <form onSubmit={doReset} className="space-y-5">
              <p className="text-white/60 text-sm">
                If an account exists for that email, a reset link has been sent.
                {devToken && (
                  <>
                    {' '}
                    <b className="text-amber-300">
                      Dev mode: use the form below to set a new password directly.
                    </b>
                  </>
                )}
              </p>
              {error && (
                <div className="rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 text-sm">
                  {error}
                </div>
              )}
              {devToken && (
                <div>
                  <label className="label">New password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    className="input"
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              )}
              <Button type="submit" disabled={loading || !devToken} className="w-full">
                {loading ? <Spinner /> : 'Set new password'}
              </Button>
            </form>
          )}
          <p className="text-center mt-6 text-sm text-white/50">
            <Link href="/login" className="text-rose-400 hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
