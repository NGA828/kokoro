'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Share2,
  MapPin,
  X,
  Heart,
  Star,
  Flag,
  ShieldOff,
  Lightbulb,
  MessageCircle,
} from 'lucide-react';
import { api, errMessage } from '@/lib/api';
import { Button, IconButton, Photo, VerifiedBadge } from '@/components/ui';
import type { ProfileCard } from '@/lib/types';

const REASONS = [
  { value: 'fake_profile', label: 'Fake profile' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'scam', label: 'Scam' },
  { value: 'other', label: 'Other' },
];

export function ProfileDetail({
  card,
  onClose,
  onBlock,
  fromMatch = false,
}: {
  card: ProfileCard;
  onClose: () => void;
  onBlock?: () => void;
  fromMatch?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reason, setReason] = useState('fake_profile');
  const [details, setDetails] = useState('');
  const [photoIdx, setPhotoIdx] = useState(0);

  const photos = card.photos?.length
    ? card.photos
    : [{ id: 'main', url: card.mainPhotoUrl ?? '' }];

  async function act(type: 'like' | 'pass' | 'superlike') {
    setBusy(true);
    try {
      const { data } = await api.post(`/likes/${card.userId}?type=${type}`);
      if (data.matched) {
        window.dispatchEvent(
          new CustomEvent('km:match', {
            detail: {
              name: data.other?.name ?? card.name,
              photo: data.other?.mainPhotoUrl ?? card.mainPhotoUrl,
              conversationId: data.match?.conversationId,
            },
          }),
        );
      }
      onClose();
    } catch (e) {
      setToast(errMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function report() {
    setBusy(true);
    try {
      await api.post('/reports', { reportedUserId: card.userId, reason, details });
      setToast('Reported. Thank you for keeping Kokoro safe.');
      setTimeout(() => {
        onBlock?.();
        onClose();
      }, 1200);
    } catch (e) {
      setToast(errMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function block() {
    setBusy(true);
    try {
      await api.post(`/blocks/${card.userId}`);
      onBlock?.();
      onClose();
    } catch (e) {
      setToast(errMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-ink-950/85 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-md max-h-[94vh] overflow-y-auto bg-ink-850 sm:rounded-[28px] rounded-t-[28px] border border-white/10 shadow-card"
      >
        {/* Photo header */}
        <div className="relative h-[420px]">
          <Photo src={photos[photoIdx]?.url} alt={card.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-850 via-transparent to-ink-950/40" />

          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-ink-950/55 backdrop-blur flex items-center justify-center text-white/90 hover:bg-ink-950/75 transition"
              aria-label="Back"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              className="w-10 h-10 rounded-full bg-ink-950/55 backdrop-blur flex items-center justify-center text-white/90 hover:bg-ink-950/75 transition"
              aria-label="Share profile"
            >
              <Share2 size={17} />
            </button>
          </div>

          {photos.length > 1 && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPhotoIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === photoIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}

          {/* floating message FAB like the mockup */}
          {!fromMatch && (
            <button
              onClick={() => act('like')}
              disabled={busy}
              className="absolute bottom-24 right-5 w-14 h-14 rounded-full bg-brand-gradient text-white shadow-glow flex items-center justify-center active:scale-90 transition disabled:opacity-40"
              aria-label="Like and message"
            >
              <MessageCircle size={24} />
            </button>
          )}

          <div className="absolute bottom-5 left-5 right-5">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-3xl font-bold">
                {card.name}
                {card.age != null && (
                  <span className="font-sans font-normal text-2xl ml-1">{card.age}</span>
                )}
              </h2>
              {card.isVerified && <VerifiedBadge className="mb-1.5" />}
            </div>
            <div className="text-white/80 text-sm mt-1 flex items-center gap-1.5">
              <MapPin size={14} className="text-rose-300" />
              {card.city}
              {card.country ? `, ${card.country}` : ''}
              {card.distanceKm != null && (
                <span className="text-rose-300 ml-1 inline-flex items-center gap-1">
                  <Heart size={12} fill="currentColor" /> {card.compatibility}% match
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {card.bio && (
            <div>
              <h3 className="font-semibold mb-1.5">About me</h3>
              <p className="text-white/70 text-sm leading-relaxed">{card.bio}</p>
            </div>
          )}

          {card.interests.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2.5">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {card.interests.map((i) => (
                  <span
                    key={i.id}
                    className="rounded-full border border-rose-400/40 bg-rose-500/10 text-sm text-white/90 px-4 py-1.5"
                  >
                    {i.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {card.compatibility != null && (
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="font-semibold text-sm">Compatibility</span>
                <span className="font-display text-2xl text-gradient font-bold">
                  {card.compatibility}%
                </span>
              </div>
              {card.compatibilityDetail?.breakdown?.map((b) => (
                <div key={b.label} className="mb-1.5">
                  <div className="flex justify-between text-xs text-white/60">
                    <span>{b.label}</span>
                    <span>{b.points}/{b.max}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/10 mt-0.5">
                    <div
                      className="h-full bg-brand-gradient rounded-full transition-all"
                      style={{ width: `${(b.points / b.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {card.compatibilityDetail?.reasons && (
            <div>
              <h3 className="font-semibold mb-2 text-sm">Why you may connect</h3>
              <ul className="space-y-1.5 text-sm text-white/70">
                {card.compatibilityDetail.reasons.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <Heart size={13} className="text-rose-400 mt-1 shrink-0" fill="currentColor" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {card.compatibilityDetail?.conversationStarters && !fromMatch && (
            <div className="rounded-2xl bg-brand-gradient-soft border border-rose-400/20 p-4">
              <h3 className="font-semibold mb-2 text-sm flex items-center gap-2">
                <Lightbulb size={15} className="text-amber-300" /> Icebreakers
              </h3>
              {card.compatibilityDetail.conversationStarters.map((s, i) => (
                <button
                  key={i}
                  onClick={() => act('like')}
                  className="block w-full text-left text-sm text-white/75 hover:text-white py-1.5 border-b border-white/5 last:border-0"
                >
                  &ldquo;{s}&rdquo;
                </button>
              ))}
            </div>
          )}

          {toast && (
            <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 px-4 py-3 text-sm">
              {toast}
            </div>
          )}

          {!fromMatch && (
            <div className="flex items-center justify-center gap-5 pt-2">
              <IconButton tone="rose" size={56} disabled={busy} onClick={() => act('pass')} aria-label="Pass">
                <X size={26} strokeWidth={2.6} />
              </IconButton>
              <IconButton tone="blue" size={46} disabled={busy} onClick={() => act('superlike')} aria-label="Super like">
                <Star size={21} fill="currentColor" />
              </IconButton>
              <IconButton tone="pink" size={62} disabled={busy} onClick={() => act('like')} aria-label="Like">
                <Heart size={29} fill="currentColor" />
              </IconButton>
            </div>
          )}

          <div className="flex gap-3 pt-3 border-t border-white/10">
            <button
              onClick={() => setShowReport((s) => !s)}
              className="text-sm text-white/50 hover:text-rose-300 flex-1 py-2 inline-flex items-center justify-center gap-1.5 transition"
            >
              <Flag size={14} /> Report
            </button>
            <button
              onClick={block}
              disabled={busy}
              className="text-sm text-white/50 hover:text-red-400 flex-1 py-2 inline-flex items-center justify-center gap-1.5 transition"
            >
              <ShieldOff size={14} /> Block
            </button>
          </div>

          {showReport && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2">
                {REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`text-sm rounded-xl px-3 py-2 border transition ${
                      reason === r.value
                        ? 'bg-brand-gradient-soft border-rose-400/50 text-white'
                        : 'bg-white/5 border-white/10 text-white/70'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <textarea
                className="input text-sm min-h-[80px]"
                placeholder="Additional details (optional)"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
              <Button variant="danger" className="w-full" disabled={busy} onClick={report}>
                Submit report
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
