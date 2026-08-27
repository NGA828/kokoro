'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { api, errMessage } from '@/lib/api';
import { Badge, Button, Photo, VerifiedBadge } from '@/components/ui';
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

  const photos = card.photos?.length ? card.photos : [{ id: 'main', url: card.mainPhotoUrl ?? '' }];

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
      await api.post('/reports', {
        reportedUserId: card.userId,
        reason,
        details,
      });
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
      className="fixed inset-0 z-50 bg-ink-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto glass-strong sm:rounded-4xl rounded-t-4xl"
      >
        <div className="relative h-96">
          <Photo src={photos[photoIdx]?.url} alt={card.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-transparent to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-ink-950/60 backdrop-blur flex items-center justify-center text-xl"
          >
            ✕
          </button>
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
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
          <div className="absolute bottom-4 left-5 right-5">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-3xl font-bold">
                {card.name}{card.age != null && <span className="font-sans font-normal text-2xl"> {card.age}</span>}
              </h2>
              {card.isVerified && <VerifiedBadge className="mb-1" />}
            </div>
            <div className="text-white/70 text-sm">
              📍 {card.city}{card.country ? `, ${card.country}` : ''}
              {card.distanceKm != null && ` · ${card.distanceKm} km away`}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {card.compatibility != null && (
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Compatibility</span>
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
                  <div className="h-1 rounded-full bg-white/10">
                    <div
                      className="h-full bg-brand-gradient rounded-full"
                      style={{ width: `${(b.points / b.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {card.compatibilityDetail?.reasons && (
            <div>
              <h3 className="font-semibold mb-2">✨ Why you may connect</h3>
              <ul className="space-y-1.5 text-sm text-white/70">
                {card.compatibilityDetail.reasons.map((r, i) => (
                  <li key={i}>• {r}</li>
                ))}
              </ul>
            </div>
          )}

          {card.bio && (
            <div>
              <h3 className="font-semibold mb-1">About</h3>
              <p className="text-white/70 text-sm leading-relaxed">{card.bio}</p>
            </div>
          )}

          {card.intentionLabel && (
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-sm">Looking for:</span>
              <Badge tone="brand">{card.intentionLabel}</Badge>
            </div>
          )}

          {card.interests.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {card.interests.map((i) => (
                  <span key={i.id} className="chip bg-white/5 border-white/10 text-sm">
                    {i.emoji} {i.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {card.compatibilityDetail?.conversationStarters && !fromMatch && (
            <div className="glass rounded-2xl p-4">
              <h3 className="font-semibold mb-2 text-sm">💬 Icebreakers</h3>
              {card.compatibilityDetail.conversationStarters.map((s, i) => (
                <button
                  key={i}
                  onClick={() => act('like')}
                  className="block w-full text-left text-sm text-white/70 hover:text-white py-1.5"
                >
                  “{s}”
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
            <div className="grid grid-cols-3 gap-3">
              <Button variant="ghost" disabled={busy} onClick={() => act('pass')}>
                ✕ Pass
              </Button>
              <Button variant="ghost" disabled={busy} onClick={() => act('superlike')}>
                🌟
              </Button>
              <Button disabled={busy} onClick={() => act('like')}>
                ❤️ Like
              </Button>
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-white/10">
            <button
              onClick={() => setShowReport((s) => !s)}
              className="text-sm text-white/50 hover:text-white flex-1 py-2"
            >
              🚨 Report
            </button>
            <button
              onClick={block}
              disabled={busy}
              className="text-sm text-white/50 hover:text-red-400 flex-1 py-2"
            >
              🚫 Block
            </button>
          </div>

          {showReport && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`text-sm rounded-xl px-3 py-2 border ${
                      reason === r.value
                        ? 'bg-brand-gradient-soft border-rose-400/50'
                        : 'bg-white/5 border-white/10'
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
