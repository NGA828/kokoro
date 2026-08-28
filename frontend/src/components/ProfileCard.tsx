'use client';

import { motion } from 'framer-motion';
import { Heart, MapPin, Star, Zap, Lock } from 'lucide-react';
import { Photo, VerifiedBadge } from '@/components/ui';
import type { ProfileCard as Card } from '@/lib/types';

export function ProfileCard({
  card,
  dragHandlers,
  onOpen,
  showBlurred = false,
}: {
  card: Card;
  dragHandlers?: Record<string, unknown> | undefined;
  onOpen?: () => void;
  showBlurred?: boolean;
}) {
  const blurred = showBlurred && card.blurred;
  return (
    <motion.div
      {...(dragHandlers ?? {})}
      className="absolute inset-0 rounded-[28px] overflow-hidden shadow-card select-none bg-ink-800"
      style={{ touchAction: 'none' }}
    >
      <Photo src={card.mainPhotoUrl} alt={card.name} blur={blurred} />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-950/15 to-ink-950/25" />

      {/* Top badges */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        <div className="flex flex-wrap gap-2">
          {card.compatibility != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/90 text-white text-xs font-bold px-3 py-1.5 backdrop-blur shadow-glow">
              <Heart size={12} fill="currentColor" /> {card.compatibility}% Match
            </span>
          )}
          {card.isSuperLike && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/90 text-white text-xs font-bold px-3 py-1.5 backdrop-blur">
              <Star size={12} fill="currentColor" /> Super Like
            </span>
          )}
          {card.isBoosted && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet2-500/90 text-white text-xs font-bold px-3 py-1.5 backdrop-blur">
              <Zap size={12} fill="currentColor" /> Boosted
            </span>
          )}
        </div>
        {card.distanceKm != null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-ink-900/60 text-white/90 text-xs font-medium px-3 py-1.5 backdrop-blur border border-white/10">
            <MapPin size={12} /> {card.distanceKm} km
          </span>
        )}
      </div>

      {/* Info */}
      <div className="absolute bottom-0 inset-x-0 p-5">
        <button
          onClick={onOpen}
          className="text-left w-full"
          aria-label={`View ${card.name}'s profile`}
        >
          <div className="flex items-end gap-2">
            <h2 className="font-display text-[28px] leading-tight font-bold drop-shadow">
              {blurred ? '???' : card.name}
              {card.age != null && !blurred && (
                <span className="text-white/85 font-sans font-normal text-2xl ml-1.5">
                  {card.age}
                </span>
              )}
            </h2>
            {card.isVerified && !blurred && <VerifiedBadge className="mb-1.5" />}
          </div>
          <div className="text-white/80 text-sm mt-1 flex items-center gap-1.5">
            <MapPin size={13} className="text-rose-300" />
            {card.city}
            {card.country ? `, ${card.country}` : ''}
          </div>

          {!blurred && card.bio && (
            <p className="text-white/75 text-sm mt-2 line-clamp-2 leading-relaxed">
              {card.bio}
            </p>
          )}

          {!blurred && card.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {card.interests.slice(0, 4).map((i) => (
                <span
                  key={i.id}
                  className="rounded-full bg-white/12 border border-white/20 text-xs font-medium text-white/95 px-3 py-1 backdrop-blur"
                >
                  {i.name}
                </span>
              ))}
              {card.interests.length > 4 && (
                <span className="rounded-full bg-white/12 border border-white/20 text-xs px-3 py-1 backdrop-blur">
                  +{card.interests.length - 4}
                </span>
              )}
            </div>
          )}

          {blurred && (
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-white/70 bg-ink-900/70 border border-white/15 rounded-full px-3 py-1.5 backdrop-blur">
              <Lock size={13} className="text-amber-300" />
              Premium to see who liked you
            </div>
          )}
        </button>
      </div>
    </motion.div>
  );
}
