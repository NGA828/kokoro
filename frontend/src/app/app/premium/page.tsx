'use client';

import {
  Crown,
  Heart,
  Star,
  Eye,
  Zap,
  SlidersHorizontal,
  Sparkles,
  RotateCcw,
  Check,
  Rocket,
} from 'lucide-react';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api, errMessage } from '@/lib/api';
import { Button, EmptyState, Spinner } from '@/components/ui';

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
  { icon: Heart, label: 'Unlimited likes', color: '#ff3d8f' },
  { icon: Star, label: 'Weekly Super Likes', color: '#38bdf8' },
  { icon: Eye, label: 'See who liked you', color: '#c92bb0' },
  { icon: Zap, label: 'Profile boosts', color: '#a875ff' },
  { icon: SlidersHorizontal, label: 'Advanced filters', color: '#3dd6ff' },
  { icon: Sparkles, label: 'Compatibility insights', color: '#fbbf24' },
  { icon: RotateCcw, label: 'Unlimited rewinds', color: '#34d399' },
  { icon: Crown, label: 'Premium badge', color: '#fbbf24' },
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
      setMsg('Welcome to Kokoro Premium!');
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
      setMsg('You are boosted for 30 minutes!');
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
      <div className="text-center mb-8">
        <span className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-brand-gradient shadow-glow text-white mb-4">
          <Crown size={30} />
        </span>
        <h1 className="font-display text-4xl font-bold">Kokoro Premium</h1>
        <p className="text-white/55 mt-2">More chances. More control. More love.</p>
      </div>

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
        <div className="card p-6 mb-8 bg-brand-gradient-soft border-amber-400/30 flex flex-wrap items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
            <Crown size={24} />
          </span>
          <div className="flex-1">
            <div className="font-display text-xl font-bold">You are Premium</div>
            <div className="text-sm text-white/60">
              {ent.subscription?.planName ?? 'Premium'}
              {ent.subscription?.expiresAt &&
                ` — active until ${new Date(ent.subscription.expiresAt).toDateString()}`}
            </div>
          </div>
          <Button onClick={boost} disabled={subscribing === 'boost'}>
            {subscribing === 'boost' ? <Spinner /> : (<><Rocket size={16} className="mr-1.5" /> Boost me now</>)}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.label} className="card p-4 text-center text-sm flex flex-col items-center gap-2.5">
              <span
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: `${f.color}1f`, color: f.color }}
              >
                <Icon size={20} />
              </span>
              {f.label}
            </div>
          );
        })}
      </div>

      {plans.length === 0 ? (
        <EmptyState icon={Crown} title="Plans coming soon" />
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
                <li className="flex items-center gap-2"><Check size={14} className="text-rose-400 shrink-0" /><span>{plan.dailyLikeLimit >= 200 ? 'Unlimited' : plan.dailyLikeLimit} likes</span></li>
                <li className="flex items-center gap-2"><Check size={14} className="text-rose-400 shrink-0" /><span>{plan.superLikesPerWeek} Super Likes / week</span></li>
                <li className={`flex items-center gap-2 ${plan.seeWhoLikesYou ? '' : 'opacity-50'}`}>
                  {plan.seeWhoLikesYou && <Check size={14} className="text-rose-400 shrink-0" />}
                  <span>See who liked you</span>
                </li>
                <li className={`flex items-center gap-2 ${plan.advancedFilters ? '' : 'opacity-50'}`}>
                  {plan.advancedFilters && <Check size={14} className="text-rose-400 shrink-0" />}
                  <span>Advanced filters</span>
                </li>
                <li className="flex items-center gap-2"><Check size={14} className="text-rose-400 shrink-0" /><span>{plan.includesBoost ? 'Free monthly boost' : 'Boosts available'}</span></li>
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
