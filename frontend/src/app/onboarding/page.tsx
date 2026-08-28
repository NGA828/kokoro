'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { api, errMessage, mediaUrl } from '@/lib/api';
import { Camera, Heart, Gem, Sprout, Sparkles, Globe, Lightbulb, ArrowRight } from 'lucide-react';
import { Logo, Button, Spinner } from '@/components/ui';
import type { Interest } from '@/lib/types';

const INTENTIONS = [
  { value: 'long_term', label: 'Long-term relationship', icon: Gem },
  { value: 'serious', label: 'Serious dating', icon: Heart },
  { value: 'friendship', label: 'Friendship first', icon: Sprout },
  { value: 'casual', label: 'Casual dating', icon: Sparkles },
  { value: 'not_sure', label: 'Still exploring', icon: Globe },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    gender: '',
    dob: '',
    city: '',
    country: '',
    bio: '',
    mainPhotoUrl: '',
    showMe: 'everyone',
    intention: 'long_term',
    ageMin: 22,
    ageMax: 34,
    maxDistanceKm: 50,
  });

  useEffect(() => {
    api
      .get('/interests')
      .then(({ data }) => setInterests(data))
      .catch(() => {});
    api
      .get('/profiles/me')
      .then(({ data }) => {
        setForm((f) => ({
          ...f,
          name: data.name || '',
          gender: data.gender || '',
          dob: data.dob ? data.dob.slice(0, 10) : '',
          city: data.city || '',
          country: data.country || '',
          bio: data.bio || '',
          mainPhotoUrl: data.mainPhotoUrl || '',
          intention: data.preferences?.intention || 'long_term',
          showMe: data.preferences?.showMe || 'everyone',
          ageMin: data.preferences?.ageMin ?? 22,
          ageMax: data.preferences?.ageMax ?? 34,
          maxDistanceKm: data.preferences?.maxDistanceKm ?? 50,
        }));
        if (Array.isArray(data.interests)) {
          setSelected(data.interests.map((i: Interest) => i.id));
        }
      })
      .catch(() => {});
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, Interest[]> = {};
    for (const i of interests) {
      const c = i.category || 'other';
      (map[c] ||= []).push(i);
    }
    return map;
  }, [interests]);

  const set = (k: string, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
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
      set('mainPhotoUrl', data.url);
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setUploading(false);
    }
  }

  async function finish() {
    setLoading(true);
    setError('');
    try {
      await api.post('/profiles/onboarding', { ...form, interestIds: selected });
      router.push('/app');
    } catch (err) {
      setError(errMessage(err));
      setLoading(false);
    }
  }

  const steps = ['Basics', 'Photo', 'About', 'Interests', 'Preferences'];

  return (
    <div className="min-h-screen bg-radial-glow py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-6">
          <Logo size="sm" />
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  i <= step ? 'bg-brand-gradient' : 'bg-white/10'
                }`}
              />
            </div>
          ))}
        </div>

        <div className="card p-6 sm:p-10 min-h-[480px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
            >
              {error && (
                <div className="rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 text-sm mb-6">
                  {error}
                </div>
              )}

              {step === 0 && (
                <div className="space-y-5">
                  <h1 className="font-display text-3xl font-bold">
                    Let’s start with the basics
                  </h1>
                  <p className="text-white/60 -mt-3">
                    This helps us show you the right people.
                  </p>
                  <div>
                    <label className="label">Your name</label>
                    <input
                      className="input"
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                      placeholder="What should matches call you?"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">I am</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { v: 'female', l: 'Woman' },
                          { v: 'male', l: 'Man' },
                        ].map((o) => (
                          <button
                            key={o.v}
                            type="button"
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
                    <div>
                      <label className="label">Birthday</label>
                      <input
                        type="date"
                        className="input [color-scheme:dark]"
                        value={form.dob}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(e) => set('dob', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">City</label>
                      <input
                        className="input"
                        value={form.city}
                        onChange={(e) => set('city', e.target.value)}
                        placeholder="e.g. Yaoundé"
                      />
                    </div>
                    <div>
                      <label className="label">Country</label>
                      <input
                        className="input"
                        value={form.country}
                        onChange={(e) => set('country', e.target.value)}
                        placeholder="Cameroon"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5 text-center">
                  <h1 className="font-display text-3xl font-bold">
                    Add your best photo
                  </h1>
                  <p className="text-white/60 -mt-3">
                    Profiles with a photo get far more matches.
                  </p>
                  <label className="block cursor-pointer">
                    <div className="relative aspect-[3/4] max-w-xs mx-auto rounded-3xl overflow-hidden border-2 border-dashed border-white/20 hover:border-rose-400/60 transition flex items-center justify-center bg-white/5">
                      {form.mainPhotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mediaUrl(form.mainPhotoUrl)}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-white/50 p-8 flex flex-col items-center">
                          <span className="w-16 h-16 rounded-2xl bg-brand-gradient-soft border border-rose-400/30 flex items-center justify-center mb-3 text-rose-300">
                            <Camera size={28} />
                          </span>
                          <div>Tap to upload a photo</div>
                          <div className="text-xs mt-1">JPG, PNG or WEBP</div>
                        </div>
                      )}
                      {uploading && (
                        <div className="absolute inset-0 bg-ink-950/70 flex items-center justify-center">
                          <Spinner />
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={uploadPhoto}
                    />
                  </label>
                  <p className="text-xs text-white/40">
                    You can add more photos and edit anytime from your profile.
                  </p>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <h1 className="font-display text-3xl font-bold">
                    Tell your story
                  </h1>
                  <p className="text-white/60 -mt-3">
                    A few genuine words go a long way.
                  </p>
                  <div>
                    <label className="label">About me</label>
                    <textarea
                      className="input min-h-[140px] resize-none"
                      maxLength={600}
                      value={form.bio}
                      onChange={(e) => set('bio', e.target.value)}
                      placeholder="What do you love? What are you looking for? What makes you smile?"
                    />
                    <div className="text-right text-xs text-white/40">
                      {form.bio.length}/600
                    </div>
                  </div>
                  <div>
                    <label className="label">I’m here for</label>
                    <div className="grid gap-2">
                      {INTENTIONS.map((i) => (
                        <button
                          key={i.value}
                          type="button"
                          onClick={() => set('intention', i.value)}
                          className={`flex items-center gap-3 rounded-2xl px-4 py-3 border text-left transition ${
                            form.intention === i.value
                              ? 'bg-brand-gradient-soft border-rose-400/50'
                              : 'bg-white/5 border-white/10 hover:border-white/25'
                          }`}
                        >
                          <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            form.intention === i.value ? 'bg-brand-gradient text-white' : 'bg-white/8 text-rose-300'
                          }`}>
                            <i.icon size={17} />
                          </span>
                          <span className="font-medium">{i.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <h1 className="font-display text-3xl font-bold">
                    Pick your interests
                  </h1>
                  <p className="text-white/60 -mt-3">
                    Choose at least 3 — shared interests are the heart of
                    compatibility.
                  </p>
                  {Object.entries(grouped).map(([cat, list]) => (
                    <div key={cat}>
                      <div className="text-xs uppercase tracking-wider text-white/40 mb-2">
                        {cat.replace('_', ' ')}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {list.map((i) => {
                          const on = selected.includes(i.id);
                          return (
                            <button
                              key={i.id}
                              type="button"
                              onClick={() =>
                                setSelected((s) =>
                                  on ? s.filter((x) => x !== i.id) : [...s, i.id],
                                )
                              }
                              className={`chip transition ${
                                on
                                  ? 'bg-brand-gradient border-transparent text-white shadow-glow'
                                  : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                              }`}
                            >
                              {i.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <h1 className="font-display text-3xl font-bold">
                    Who do you want to meet?
                  </h1>
                  <div>
                    <label className="label">Show me</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { v: 'female', l: 'Women' },
                        { v: 'male', l: 'Men' },
                        { v: 'everyone', l: 'Everyone' },
                      ].map((o) => (
                        <button
                          key={o.v}
                          type="button"
                          onClick={() => set('showMe', o.v)}
                          className={`rounded-2xl py-3 border font-medium transition ${
                            form.showMe === o.v
                              ? 'bg-brand-gradient-soft border-rose-400/50'
                              : 'bg-white/5 border-white/10'
                          }`}
                        >
                          {o.l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">
                      Age range: {form.ageMin} – {form.ageMax}
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min={18}
                        max={80}
                        value={form.ageMin}
                        onChange={(e) =>
                          set('ageMin', Math.min(+e.target.value, form.ageMax - 1))
                        }
                        className="flex-1 accent-rose-500"
                      />
                      <input
                        type="range"
                        min={18}
                        max={80}
                        value={form.ageMax}
                        onChange={(e) =>
                          set('ageMax', Math.max(+e.target.value, form.ageMin + 1))
                        }
                        className="flex-1 accent-violet2-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">
                      Maximum distance: {form.maxDistanceKm} km
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={500}
                      step={5}
                      value={form.maxDistanceKm}
                      onChange={(e) => set('maxDistanceKm', +e.target.value)}
                      className="w-full accent-rose-500"
                    />
                  </div>
                  <div className="glass rounded-2xl p-4 text-sm text-white/60">
                    <span className="flex items-center gap-2">
                      <Lightbulb size={15} className="text-amber-300 shrink-0" />
                      You can fine-tune all of this later in Settings.
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-10">
            <Button
              variant="ghost"
              onClick={() => (step === 0 ? router.push('/') : setStep(step - 1))}
            >
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 0 && (!form.name || !form.gender || !form.dob || !form.city))
                }
              >
                Continue
              </Button>
            ) : (
              <Button onClick={finish} disabled={loading || selected.length < 1}>
                {loading ? <Spinner /> : (<span className='inline-flex items-center gap-2'>Start discovering <Heart size={16} fill='currentColor' /></span>)}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
