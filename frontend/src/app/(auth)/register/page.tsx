'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, errMessage } from '@/lib/api';
import { useAuth } from '@/lib/store';
import { Logo, Button, Spinner } from '@/components/ui';

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuth((s) => s.setSession);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    dob: '',
    gender: '',
    city: '',
    country: 'Cameroon',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      setSession(
        { accessToken: data.accessToken, refreshToken: data.refreshToken },
        data.user,
      );
      router.push('/onboarding');
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-radial-glow">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <Logo href="/" size="lg" />
        </div>
        <div className="card p-8 sm:p-10">
          <h1 className="font-display text-3xl font-bold mb-2">
            Begin your <span className="text-gradient">journey</span>
          </h1>
          <p className="text-white/60 mb-8 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-rose-400 hover:underline">
              Log in
            </Link>
          </p>
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="label">Full name</label>
              <input
                className="input"
                required
                maxLength={120}
                placeholder="e.g. Vanessa Etienne"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                minLength={8}
                className="input"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Date of birth</label>
                <input
                  type="date"
                  required
                  max={new Date(new Date().getFullYear() - 18, 11, 31)
                    .toISOString()
                    .slice(0, 10)}
                  className="input [color-scheme:dark]"
                  value={form.dob}
                  onChange={(e) => set('dob', e.target.value)}
                />
              </div>
              <div>
                <label className="label">I am</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: 'female', l: 'Woman' },
                    { v: 'male', l: 'Man' },
                  ].map((o) => (
                    <button
                      type="button"
                      key={o.v}
                      onClick={() => set('gender', o.v)}
                      className={`rounded-2xl py-3 font-semibold border transition-all duration-150 active:scale-95 ${
                        form.gender === o.v
                          ? 'bg-brand-gradient text-white border-transparent shadow-glow'
                          : 'bg-white/[0.06] border-white/15 text-white/70 hover:border-rose-400/50 hover:text-white'
                      }`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">City</label>
                <input
                  className="input"
                  required
                  placeholder="e.g. Yaoundé"
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Country</label>
                <input
                  className="input"
                  placeholder="Cameroon"
                  value={form.country}
                  onChange={(e) => set('country', e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-white/40">
              By continuing you confirm you are 18 or older and agree to treat
              other members with respect. Kokoro March is an 18+ platform.
            </p>
            <Button type="submit" disabled={loading} className="w-full !py-3.5">
              {loading ? <Spinner /> : 'Create account'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
