'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, errMessage } from '@/lib/api';
import { useAuth } from '@/lib/store';
import { Button, PageHeader, Spinner } from '@/components/ui';

const TOGGLES: { key: string; label: string }[] = [
  { key: 'showOnlineStatus', label: 'Show my online status' },
  { key: 'showDistance', label: 'Show approximate distance' },
  { key: 'notifMessage', label: 'New message notifications' },
  { key: 'notifLike', label: 'Like notifications' },
  { key: 'notifMatch', label: 'Match notifications' },
  { key: 'notifSystem', label: 'System & Premium notifications' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<Record<string, any> | null>(null);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/users/me/settings').then(({ data }) => setSettings(data));
  }, []);

  async function patch(patchBody: Record<string, unknown>) {
    setError('');
    try {
      const { data } = await api.patch('/users/me/settings', patchBody);
      setSettings(data);
    } catch (e) {
      setError(errMessage(e));
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMsg('');
    try {
      await api.post('/users/me/change-password', pw);
      setMsg('Password changed.');
      setPw({ currentPassword: '', newPassword: '' });
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function deactivate() {
    if (!confirm('Deactivate your account? You can reactivate by logging in.')) return;
    await api.post('/users/me/deactivate');
    logout();
    router.push('/');
  }

  async function deleteAccount() {
    if (!confirm('Permanently delete your account? This cannot be undone.')) return;
    if (!confirm('Really delete? Your profile and matches will be removed.')) return;
    await api.delete('/users/me');
    logout();
    router.push('/');
  }

  if (!settings) {
    return (
      <div className="pt-14 lg:pt-0 flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="pt-14 lg:pt-0 max-w-2xl mx-auto space-y-6">
      <PageHeader title="Settings ⚙️" subtitle="Manage your account, privacy and security." />

      {(msg || error) && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm ${
            error
              ? 'bg-red-500/10 border border-red-500/30 text-red-300'
              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
          }`}
        >
          {error || msg}
        </div>
      )}

      {/* Discovery preference */}
      <section className="card p-6">
        <h3 className="font-semibold mb-4">Privacy</h3>
        <div className="flex items-center justify-between py-3 border-b border-white/5">
          <div>
            <div className="font-medium">Profile visibility</div>
            <div className="text-sm text-white/50">
              Hidden profiles don’t appear in Discovery.
            </div>
          </div>
          <select
            className="input !w-auto !py-2 [color-scheme:dark]"
            value={settings.profileVisibility}
            onChange={(e) => patch({ profileVisibility: e.target.value })}
          >
            <option value="public">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
        {TOGGLES.map((t) => (
          <label
            key={t.key}
            className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 cursor-pointer"
          >
            <span className="text-sm">{t.label}</span>
            <input
              type="checkbox"
              className="w-5 h-5 accent-rose-500"
              checked={!!settings[t.key]}
              onChange={(e) => patch({ [t.key]: e.target.checked })}
            />
          </label>
        ))}
      </section>

      {/* Discovery preferences shortcut */}
      <section className="card p-6">
        <h3 className="font-semibold mb-2">Discovery preferences</h3>
        <p className="text-sm text-white/50 mb-4">
          Fine-tune who you see — gender, age range and distance.
        </p>
        <Button variant="ghost" onClick={() => router.push('/app/discover')}>
          Open Discovery
        </Button>
      </section>

      {/* Security */}
      <section className="card p-6">
        <h3 className="font-semibold mb-4">Security</h3>
        <form onSubmit={changePassword} className="space-y-3">
          <div>
            <label className="label">Current password</label>
            <input
              type="password"
              className="input"
              value={pw.currentPassword}
              onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">New password</label>
            <input
              type="password"
              className="input"
              minLength={8}
              value={pw.newPassword}
              onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))}
            />
          </div>
          <Button type="submit" disabled={busy} variant="ghost">
            {busy ? <Spinner /> : 'Update password'}
          </Button>
        </form>
      </section>

      {/* Account */}
      <section className="card p-6">
        <h3 className="font-semibold mb-2">Account</h3>
        <p className="text-sm text-white/50 mb-4">
          Signed in as <b className="text-white/80">{user?.email}</b>
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              logout();
              router.push('/login');
            }}
          >
            🚪 Log out
          </Button>
          <Button variant="ghost" onClick={deactivate}>
            Deactivate account
          </Button>
          <Button variant="danger" onClick={deleteAccount}>
            Delete account
          </Button>
        </div>
      </section>
    </div>
  );
}
