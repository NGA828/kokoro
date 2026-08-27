'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { RotateCcw, X, Heart, Star, SlidersHorizontal, Moon, Info } from 'lucide-react';
import { api, errMessage } from '@/lib/api';
import { Button, EmptyState, Skeleton, IconButton } from '@/components/ui';
import { ProfileCard } from '@/components/ProfileCard';
import { ProfileDetail } from '@/components/ProfileDetail';
import { MatchModal } from '@/components/MatchModal';
import type { ProfileCard as Card } from '@/lib/types';

interface MatchResult {
  matched: boolean;
  match?: { id: string; conversationId: string };
  other?: Card;
  superLike?: boolean;
}

export default function DiscoverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [match, setMatch] = useState<
    | (MatchResult & { name?: string; photo?: string; conversationId?: string })
    | null
  >(null);
  const [detail, setDetail] = useState<Card | null>(null);
  const [quota, setQuota] = useState<{ likesRemaining: number; superRemaining: number; isPremium: boolean } | null>(null);
  const [filters, setFilters] = useState({ show: false });
  const [lastSwipe, setLastSwipe] = useState<'left' | 'right' | 'up'>('right');
  const [f, setF] = useState({
    showMe: '',
    ageMin: 18,
    ageMax: 45,
    maxDistanceKm: 250,
    intention: '',
  });

  useEffect(() => {
    api.get('/preferences').then(({ data }) => {
      setF((prev) => ({
        ...prev,
        showMe: data.showMe ?? '',
        ageMin: data.ageMin ?? 18,
        ageMax: data.ageMax ?? 45,
        maxDistanceKm: data.maxDistanceKm ?? 250,
        intention: data.intention ?? '',
      }));
    }).catch(() => {});
  }, []);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-18, 18]);
  const likeOpacity = useTransform(x, [60, 200], [0, 1]);
  const passOpacity = useTransform(x, [-200, -60], [1, 0]);

  const load = useCallback(async (reset = false, opts?: typeof f) => {
    const currentOffset = reset ? 0 : offset;
    const ff = opts ?? f;
    const qs = new URLSearchParams({ limit: '10', offset: String(currentOffset) });
    if (ff.showMe) qs.set('showMe', ff.showMe);
    if (ff.ageMin) qs.set('ageMin', String(ff.ageMin));
    if (ff.ageMax) qs.set('ageMax', String(ff.ageMax));
    if (ff.maxDistanceKm) qs.set('maxDistanceKm', String(ff.maxDistanceKm));
    if (ff.intention) qs.set('intention', ff.intention);
    try {
      const { data } = await api.get(`/discover?${qs.toString()}`);
      setCards((prev) => (reset ? data.items : [...prev, ...(data.items ?? [])]));
      setHasMore(data.hasMore);
      setOffset(currentOffset + (data.items?.length ?? 0));
      setQuota(data.quota);
    } catch {
      setToast('Could not load profiles. Pull to retry.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyFilters(next: typeof f) {
    setF(next);
    setLoading(true);
    load(true, next);
    setFilters({ show: false });
  }

  // Direct-profile deep link: /app/discover?u=<userId>
  useEffect(() => {
    const u = searchParams.get('u');
    if (u) {
      api.get(`/profiles/${u}`).then(({ data }) => {
        if (data && !data.notFound) setDetail(data);
      }).catch(() => {});
    }
  }, [searchParams]);

  // Match triggered from the profile detail modal
  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail as {
        name: string;
        photo: string;
        conversationId: string;
      };
      setMatch({ matched: true, name: d.name, photo: d.photo, conversationId: d.conversationId });
    };
    window.addEventListener('km:match', handler);
    return () => window.removeEventListener('km:match', handler);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  };

  const act = useCallback(
    async (userId: string, type: 'like' | 'pass' | 'superlike') => {
      if (busy) return;
      setLastSwipe(type === 'pass' ? 'left' : type === 'superlike' ? 'up' : 'right');
      setBusy(true);
      try {
        const { data } = await api.post(
          `/likes/${userId}?type=${type}`,
        );
        setCards((prev) => prev.filter((c) => c.userId !== userId));
        const q = await api.get('/likes/quota');
        setQuota(q.data);
        if (data.matched) {
          setMatch({
            ...data,
            conversationId: data.match?.conversationId,
            name: data.other?.name,
            photo: data.other?.mainPhotoUrl,
          });
        } else if (type === 'superlike') {
          showToast('Super Like sent!');
        }
      } catch (e) {
        showToast(errMessage(e));
      } finally {
        setBusy(false);
      }
    },
    [busy],
  );

  function onDragEnd(_: unknown, info: PanInfo) {
    const top = cards[0];
    if (!top) return;
    if (info.offset.x > 120 || info.velocity.x > 500) {
      act(top.userId, 'like');
    } else if (info.offset.x < -120 || info.velocity.x < -500) {
      act(top.userId, 'pass');
    } else if (info.offset.y < -120 || info.velocity.y < -600) {
      act(top.userId, 'superlike');
    }
    x.set(0);
  }

  async function rewind() {
    if (busy) return;
    setBusy(true);
    try {
      const { data } = await api.post('/likes/actions/rewind');
      if (data.restored) {
        setCards((prev) => [data.restored, ...prev.filter((c) => c.userId !== data.restored.userId)]);
      } else {
        showToast('Nothing to undo right now.');
      }
    } catch (e) {
      showToast(errMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const top = cards[0];

  return (
    <div className="pt-14 lg:pt-0 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-3xl font-bold">Discover</h1>
        <button
          onClick={() => setFilters((f) => ({ show: !f.show }))}
          className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 border border-rose-400/30 text-rose-300 text-sm font-semibold px-4 py-2 hover:bg-rose-500/25 transition"
        >
          <SlidersHorizontal size={15} /> Filters
        </button>
      </div>

      {quota && (
        <div className="text-xs text-white/50 mb-3 flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <Heart size={13} className="text-rose-400" /> {quota.likesRemaining} likes left
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Star size={13} className="text-sky-400" /> {quota.superRemaining} super likes
          </span>
          {!quota.isPremium && (
            <button onClick={() => router.push('/app/premium')} className="text-rose-400 hover:underline ml-auto font-medium">
              Go unlimited
            </button>
          )}
        </div>
      )}

      {/* Filters panel */}
      <AnimatePresence>
        {filters.show && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="card p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">Show me</label>
                <div className="flex gap-2 mt-2">
                  {[
                    { v: '', l: 'Everyone' },
                    { v: 'female', l: 'Women' },
                    { v: 'male', l: 'Men' },
                  ].map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setF({ ...f, showMe: o.v })}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                        f.showMe === o.v
                          ? 'bg-brand-gradient text-white shadow-glow'
                          : 'bg-white/8 border border-white/15 text-white/70'
                      }`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wide flex justify-between">
                  Age range <span className="text-rose-300">{f.ageMin}–{f.ageMax}</span>
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <input type="range" min={18} max={60} value={f.ageMin}
                    onChange={(e) => setF({ ...f, ageMin: Math.min(Number(e.target.value), f.ageMax) })}
                    className="flex-1 accent-rose-500" />
                  <input type="range" min={18} max={70} value={f.ageMax}
                    onChange={(e) => setF({ ...f, ageMax: Math.max(Number(e.target.value), f.ageMin) })}
                    className="flex-1 accent-rose-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wide flex justify-between">
                  Max distance <span className="text-rose-300">{f.maxDistanceKm >= 500 ? 'Anywhere' : `${f.maxDistanceKm} km`}</span>
                </label>
                <input type="range" min={10} max={500} step={10} value={f.maxDistanceKm}
                  onChange={(e) => setF({ ...f, maxDistanceKm: Number(e.target.value) })}
                  className="w-full mt-2 accent-rose-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/60 uppercase tracking-wide">Looking for</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    { v: '', l: 'Any' },
                    { v: 'casual', l: 'Casual' },
                    { v: 'long_term', l: 'Long-term' },
                    { v: 'marriage', l: 'Marriage' },
                  ].map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setF({ ...f, intention: o.v })}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                        f.intention === o.v
                          ? 'bg-brand-gradient text-white shadow-glow'
                          : 'bg-white/8 border border-white/15 text-white/70'
                      }`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <Button variant="ghost" className="flex-1" onClick={() => setFilters({ show: false })}>Cancel</Button>
                <Button className="flex-1" onClick={() => applyFilters(f)}>Apply filters</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card stack */}
      <div className="relative h-[62vh] min-h-[440px]">
        {loading ? (
          <Skeleton className="absolute inset-0 rounded-4xl" />
        ) : cards.length === 0 ? (
          <EmptyState
            icon={Moon}
            title="You are all caught up"
            body="No more profiles match right now. Try widening your filters or check back soon."
            action={
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => load(true)}>
                  Refresh
                </Button>
                <Button onClick={() => router.push('/app/premium')}>
                  Boost my profile
                </Button>
              </div>
            }
          />
        ) : (
          <AnimatePresence>
            {cards.slice(0, 3).map((card, i) =>
              i === 0 ? (
                <motion.div
                  key={card.userId}
                  style={{ x, rotate, zIndex: 10 - i }}
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={0.75}
                  dragTransition={{ bounceStiffness: 300, bounceDamping: 24 }}
                  onDragEnd={onDragEnd}
                  exit={
                    lastSwipe === 'up'
                      ? { y: -600, opacity: 0, transition: { duration: 0.32, ease: 'easeIn' } }
                      : lastSwipe === 'left'
                        ? { x: -500, rotate: -24, opacity: 0, transition: { duration: 0.32, ease: 'easeIn' } }
                        : { x: 500, rotate: 24, opacity: 0, transition: { duration: 0.32, ease: 'easeIn' } }
                  }
                  className="absolute inset-0"
                >
                  <ProfileCard card={card} onOpen={() => setDetail(card)} />
                  {/* Swipe overlays */}
                  <motion.div
                    style={{ opacity: likeOpacity }}
                    className="absolute top-10 left-6 rotate-[-12deg] border-4 border-emerald-400 text-emerald-400 text-4xl font-black rounded-2xl px-4 py-1 pointer-events-none"
                  >
                    LIKE
                  </motion.div>
                  <motion.div
                    style={{ opacity: passOpacity }}
                    className="absolute top-10 right-6 rotate-[12deg] border-4 border-rose-500 text-rose-500 text-4xl font-black rounded-2xl px-4 py-1 pointer-events-none"
                  >
                    NOPE
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key={card.userId}
                  style={{ scale: 1 - i * 0.04, y: i * 10, zIndex: 10 - i }}
                  className="absolute inset-0"
                >
                  <ProfileCard card={card} />
                </motion.div>
              ),
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Action buttons — rewind, pass, super, like, info */}
      {cards.length > 0 && (
        <div className="flex items-center justify-center gap-3 sm:gap-4 mt-7">
          <IconButton tone="gold" size={44} onClick={rewind} aria-label="Rewind" className="opacity-90">
            <RotateCcw size={19} />
          </IconButton>
          <IconButton
            tone="rose"
            size={58}
            onClick={() => top && act(top.userId, 'pass')}
            disabled={busy}
            aria-label="Pass"
          >
            <X size={28} strokeWidth={2.6} />
          </IconButton>
          <IconButton
            tone="blue"
            size={48}
            onClick={() => top && act(top.userId, 'superlike')}
            disabled={busy}
            aria-label="Super like"
          >
            <Star size={22} fill="currentColor" />
          </IconButton>
          <IconButton
            tone="pink"
            size={64}
            onClick={() => top && act(top.userId, 'like')}
            disabled={busy}
            aria-label="Like"
          >
            <Heart size={30} fill="currentColor" />
          </IconButton>
          <IconButton tone="purple" size={44} onClick={() => top && setDetail(top)} aria-label="View profile">
            <Info size={19} />
          </IconButton>
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 glass-strong rounded-full px-6 py-3 text-sm z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile detail */}
      <AnimatePresence>
        {detail && (
          <ProfileDetail
            card={detail}
            onClose={() => setDetail(null)}
            onBlock={() => {
              setDetail(null);
              setCards((prev) => prev.filter((c) => c.userId !== detail.userId));
            }}
          />
        )}
      </AnimatePresence>

      {/* Match modal */}
      <AnimatePresence>
        {match && (
          <MatchModal
            name={match.name ?? 'someone'}
            photo={match.photo ?? null}
            conversationId={match.conversationId}
            onClose={() => setMatch(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}


