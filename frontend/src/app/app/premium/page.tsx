'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api, errMessage } from '@/lib/api';
import { Button, EmptyState, PageHeader, Spinner } from '@/components/ui';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  periodDays: number;
  dailyLikeLimit: number;
  superLikesPerWeek: number;
  includesBoost: boolean;
  seeWhoLikesYou: boolean;
  advancedFilters: boolean;
}

const FEATURES = [
  { icon: '❤️', label: 'Unlimited likes' },
  { icon: '🌟', label: 'Weekly Super Likes' },
  { icon: '👀', label: 'See who liked you' },
  { icon: '🚀', label: 'Profile boosts' },
  { icon: '🎯', label: 'Advanced filters' },
  { icon: '🔮', label: 'Compatibility insights' },
  { icon: '↩️', label: 'Unlimited rewinds' },
  { icon: '🎨', label: 'Premium profile themes' },
];

export default function PremiumPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [ent, setEnt] = useState<{ isPremium: boolean; boostedUntil: string | null; subscription?: { expiresAt?: string; planName?: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');

  function load() {
    Promise.all([api.get('/premium/plans'), api.get('/premium/me')])
      .then(([p, e]) => {
        setPlans(p.data);
        setEnt(e.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function subscribe(planId: string) {
    setSubscribing(planId);
    setError('');
    setMsg('');
    try {
      await api.post('/premium/subscribe', { planId, payerPhone: phone || undefined });
      setMsg('Welcome to Kokoro Premium! ✨');
      load();
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setSubscribing(null);
    }
  }

  async function boost() {
    setSubscribing('boost');
    try {
      await api.post('/premium/boost', { payerPhone: phone || undefined });
      setMsg('You are boosted for 30 minutes! 🚀');
      load();
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setSubscribing(null);
    }
  }

  if (loading) {
    return (
      <div className="pt-14 lg:pt-0 flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="pt-14 lg:pt-0 max-w-4xl mx-auto">
      <PageHeader title="Kokoro Premium ⭐" subtitle="More chances. More control. More love." />

      {(msg || error) && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm mb-6 ${
            error
              ? 'bg-red-500/10 border border-red-500/30 text-red-300'
              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
          }`}
        >
          {error || msg}
        </div>
      )}

      {ent?.isPremium && (
        <div className="card p-6 mb-8 bg-brand-gradient-soft border-rose-400/30 flex flex-wrap items-center gap-4">
          <span className="text-4xl">👑</span>
          <div className="flex-1">
            <div className="font-display text-xl font-bold">You are Premium</div>
            <div className="text-sm text-white/60">
              {ent.subscription?.planName ?? 'Premium'}
              {ent.subscription?.expiresAt &&
                ` — active until ${new Date(ent.subscription.expiresAt).toDateString()}`}
            </div>
          </div>
          <Button onClick={boost} disabled={subscribing === 'boost'}>
            {subscribing === 'boost' ? <Spinner /> : '🚀 Boost me now'}
          </Button>
        </div>
      )}

      {/* Features */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {FEATURES.map((f) => (
          <div key={f.label} className="card p-4 text-center text-sm">
            <div className="text-2xl mb-2">{f.icon}</div>
            {f.label}
          </div>
        ))}
      </div>

      {plans.length === 0 ? (
        <EmptyState icon="⭐" title="Plans coming soon" />
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`card p-8 relative ${i === 1 ? 'border-rose-400/40 bg-brand-gradient-soft' : ''}`}
            >
              {i === 1 && (
                <span className="absolute -top-3 right-6 chip bg-brand-gradient border-transparent text-white text-xs">
                  Best value
                </span>
              )}
              <h3 className="font-display text-2xl font-bold">{plan.name.replace(/Kokoro Premium —? ?/, '')}</h3>
              <div className="mt-4 mb-6">
                <span className="font-display text-4xl font-bold">
                  {plan.price.toLocaleString()}
                </span>
                <span className="text-white/50"> {plan.currency}</span>
                <span className="text-white/50 text-sm">
                  {' '}
                  / {plan.periodDays >= 365 ? 'year' : 'month'}
                </span>
              </div>
              <ul className="space-y-2.5 text-sm text-white/70 mb-6">
                <li>✦ {plan.dailyLikeLimit >= 200 ? 'Unlimited' : plan.dailyLikeLimit} likes</li>
                <li>✦ {plan.superLikesPerWeek} Super Likes / week</li>
                <li>✦ {plan.seeWhoLikesYou ? 'See who liked you' : '—'}</li>
                <li>✦ {plan.advancedFilters ? 'Advanced filters' : '—'}</li>
                <li>✦ {plan.includesBoost ? 'Free monthly boost' : 'Boosts available'}</li>
              </ul>
              <div className="mb-4">
                <input
                  className="input text-sm"
                  placeholder="Mobile money phone (optional, e.g. +2376…)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                variant={i === 1 ? 'primary' : 'ghost'}
                disabled={subscribing === plan.id || ent?.isPremium}
                onClick={() => subscribe(plan.id)}
              >
                {subscribing === plan.id ? (
                  <Spinner />
                ) : ent?.isPremium ? (
                  'Current plan'
                ) : (
                  'Subscribe'
                )}
              </Button>
            </motion.div>
          ))}
        </div>
      )}
      <p className="text-xs text-white/40 text-center mt-6">
        Payments are processed via secure providers (MTN Mobile Money / Orange
        Money ready). No card or PIN details are stored on Kokoro March.
      </p>
    </div>
  );
}
