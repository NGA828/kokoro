'use client';

import { MapPin, BadgeCheck, Plus, Trash2 } from 'lucide-react';

import { useEffect, useState } from 'react';
import { api, errMessage, mediaUrl } from '@/lib/api';
import {
  Avatar,
  Badge,
  Button,
  PageHeader,
  Photo,
  Spinner,
  VerifiedBadge,
} from '@/components/ui';
import type { Interest } from '@/lib/types';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState({ name: '', bio: '', city: '', country: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/profiles/me'), api.get('/interests')]).then(
      ([p, i]) => {
        setProfile(p.data);
        setInterests(i.data);
        setSelected((p.data.interests ?? []).map((x: Interest) => x.id));
        setForm({
          name: p.data.name ?? '',
          bio: p.data.bio ?? '',
          city: p.data.city ?? '',
          country: p.data.country ?? '',
        });
      },
    );
  }, []);

  async function saveInterests(ids: string[]) {
    await api.post('/profiles/onboarding', { interestIds: ids });
  }

  async function toggleInterest(id: string) {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    setSelected(next);
    try {
      await saveInterests(next);
      setMsg('Interests updated');
      setTimeout(() => setMsg(''), 2000);
    } catch (e) {
      setError(errMessage(e));
    }
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      const { data } = await api.patch('/profiles/me', form);
      setProfile(data);
      setMsg('Profile saved');
      setTimeout(() => setMsg(''), 2000);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('km_access');
      const res = await fetch(
        (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api') +
          '/media/upload?kind=photo',
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      const { data: p } = await api.get('/profiles/me');
      setProfile(p);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setUploading(false);
    }
  }

  async function requestVerification() {
    try {
      await api.post('/profiles/me/verification');
      setProfile((p) => p && { ...p, verification: 'pending' });
      setMsg('Verification requested — our team will review it.');
    } catch (e) {
      setError(errMessage(e));
    }
  }

  if (!profile) {
    return (
      <div className="pt-14 lg:pt-0 flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="pt-14 lg:pt-0 max-w-3xl mx-auto">
      <PageHeader title="Your profile" subtitle="This is how matches see you." />

      {(msg || error) && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm mb-5 ${
            error
              ? 'bg-red-500/10 border border-red-500/30 text-red-300'
              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
          }`}
        >
          {error || msg}
        </div>
      )}

      {/* Header card */}
      <div className="card overflow-hidden mb-6">
        <div className="h-32 bg-brand-gradient opacity-80 relative">
          <div className="absolute -bottom-10 left-6 flex items-end gap-4">
            <div className="rounded-3xl overflow-hidden border-4 border-ink-900 w-24 h-24">
              <Photo src={profile.mainPhotoUrl} alt={profile.name} />
            </div>
          </div>
        </div>
        <div className="pt-14 px-6 pb-6">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-display text-2xl font-bold">
              {profile.name}, {profile.age}
            </h2>
            {profile.isVerified && <VerifiedBadge />}
          </div>
          <div className="text-white/60 text-sm mb-4 flex items-center gap-1.5">
            <MapPin size={14} className="text-rose-300" />
            {profile.city}
            {profile.country ? `, ${profile.country}` : ''}
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge tone={profile.verification === 'verified' ? 'green' : profile.verification === 'pending' ? 'gold' : 'default'}>
              {profile.verification === 'verified'
                ? 'Verified'
                : profile.verification === 'pending'
                  ? 'Verification pending'
                  : 'Not verified'}
            </Badge>
            <Badge tone="brand">Profile {profile.completion}% complete</Badge>
          </div>
          {profile.verification !== 'verified' && profile.verification !== 'pending' && (
            <Button variant="ghost" className="text-sm inline-flex items-center gap-2" onClick={requestVerification}>
              <BadgeCheck size={16} /> Request verification
            </Button>
          )}
        </div>
      </div>

      {/* Photos */}
      <div className="card p-6 mb-6">
        <h3 className="font-semibold mb-4">Photos</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {profile.photos?.map((p: { id: string; url: string }) => (
            <div key={p.id} className="aspect-[3/4] rounded-2xl overflow-hidden relative group">
              <Photo src={p.url} alt="photo" />
              <button
                onClick={async () => {
                  await api.delete(`/profiles/me/photos/${p.id}`);
                  const { data } = await api.get('/profiles/me');
                  setProfile(data);
                }}
                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-ink-950/70 flex items-center justify-center text-white/80 hover:bg-red-500/80 opacity-0 group-hover:opacity-100 transition"
                aria-label="Delete photo"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <label className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/20 hover:border-rose-400/60 flex flex-col items-center justify-center cursor-pointer text-white/50 text-xs gap-1">
            {uploading ? <Spinner /> : <><Plus size={20} /><span>Add photo</span></>}
            <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
          </label>
        </div>
      </div>

      {/* Edit details */}
      <div className="card p-6 mb-6 space-y-4">
        <h3 className="font-semibold">Edit details</h3>
        <div>
          <label className="label">Name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">About me</label>
          <textarea
            className="input min-h-[120px]"
            maxLength={600}
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">City</label>
            <input
              className="input"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Country</label>
            <input
              className="input"
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            />
          </div>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Spinner /> : 'Save changes'}
        </Button>
      </div>

      {/* Interests */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Your interests</h3>
        <div className="flex flex-wrap gap-2">
          {interests.map((i) => {
            const on = selected.includes(i.id);
            return (
              <button
                key={i.id}
                onClick={() => toggleInterest(i.id)}
                className={`chip transition ${
                  on
                    ? 'bg-brand-gradient border-transparent text-white'
                    : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                }`}
              >
                {i.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
