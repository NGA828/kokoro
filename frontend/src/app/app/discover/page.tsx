'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { api, errMessage } from '@/lib/api';
import { Button, EmptyState, Skeleton } from '@/components/ui';
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

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-18, 18]);
  const likeOpacity = useTransform(x, [60, 200], [0, 1]);
  const passOpacity = useTransform(x, [-200, -60], [1, 0]);

  const load = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    try {
      const { data } = await api.get(
        `/discover?limit=10&offset=${currentOffset}`,
      );
      setCards((prev) => (reset ? data.items : [...prev, ...(data.items ?? [])]));
      setHasMore(data.hasMore);
      setOffset(currentOffset + (data.items?.length ?? 0));
      setQuota(data.quota);
    } catch {
      setToast('Could not load profiles. Pull to retry.');
    } finally {
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          showToast('Super Like sent! 🌟');
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
      fly('right');
      act(top.userId, 'like');
    } else if (info.offset.x < -120 || info.velocity.x < -500) {
      fly('left');
      act(top.userId, 'pass');
    } else if (info.offset.y < -120) {
      act(top.userId, 'superlike');
    }
    x.set(0);
  }

  const fly = (dir: 'left' | 'right') => {
    // Visual snap handled by animate on exit; AnimatePresence popLayout does it.
    void dir;
  };

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
          className="btn-ghost !py-2 !px-4 text-sm"
        >
          ⚙️ Filters
        </button>
      </div>

      {quota && (
        <div className="text-xs text-white/50 mb-3 flex items-center gap-3">
          <span>❤️ {quota.likesRemaining} likes left today</span>
          <span>🌟 {quota.superRemaining} super likes</span>
          {!quota.isPremium && (
            <button onClick={() => router.push('/app/premium')} className="text-rose-400 hover:underline ml-auto">
              Go unlimited
            </button>
          )}
        </div>
      )}

      {/* Card stack */}
      <div className="relative h-[62vh] min-h-[440px]">
        {loading ? (
          <Skeleton className="absolute inset-0 rounded-4xl" />
        ) : cards.length === 0 ? (
          <EmptyState
            icon="🌙"
            title="You are all caught up"
            body="No more profiles nearby right now. Check back soon, widen your distance, or your next great match might just be around the corner. ❤️"
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
                  dragElastic={0.8}
                  onDragEnd={onDragEnd}
                  exit={{ x: 400, opacity: 0, transition: { duration: 0.25 } }}
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

      {/* Action buttons */}
      {cards.length > 0 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <ActionButton onClick={rewind} icon="↩️" label="Undo" small />
          <ActionButton
            onClick={() => top && act(top.userId, 'pass')}
            icon="✕"
            label="Pass"
            tone="pass"
            disabled={busy}
          />
          <ActionButton
            onClick={() => top && act(top.userId, 'superlike')}
            icon="🌟"
            label="Super"
            tone="super"
            disabled={busy}
          />
          <ActionButton
            onClick={() => top && act(top.userId, 'like')}
            icon="❤️"
            label="Like"
            tone="like"
            disabled={busy}
          />
          <ActionButton
            onClick={() => top && setDetail(top)}
            icon="👤"
            label="Profile"
            small
          />
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

function ActionButton({
  onClick,
  icon,
  label,
  tone = 'default',
  small = false,
  disabled = false,
}: {
  onClick: () => void;
  icon: string;
  label: string;
  tone?: 'like' | 'pass' | 'super' | 'default';
  small?: boolean;
  disabled?: boolean;
}) {
  const tones = {
    like: 'w-16 h-16 text-3xl bg-brand-gradient shadow-glow',
    pass: 'w-14 h-14 text-2xl bg-white/10 border border-white/20',
    super: 'w-12 h-12 text-xl bg-sky-500/20 border border-sky-400/40',
    default: small
      ? 'w-12 h-12 text-xl bg-white/5 border border-white/10'
      : 'w-14 h-14 text-2xl bg-white/10 border border-white/20',
  };
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.08 }}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full flex flex-col items-center justify-center text-white disabled:opacity-40 ${tones[tone]} ${small ? tones.default : ''}`}
      aria-label={label}
    >
      <span>{icon}</span>
    </motion.button>
  );
}
