'use client';

import { motion } from 'framer-motion';
import { Badge, Photo, VerifiedBadge } from '@/components/ui';
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
  return (
    <motion.div
      {...(dragHandlers ?? {})}
      className="absolute inset-0 rounded-4xl overflow-hidden shadow-card select-none"
      style={{ touchAction: 'none' }}
    >
      <Photo src={card.mainPhotoUrl} alt={card.name} blur={showBlurred && card.blurred} />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-950/20 to-transparent" />

      {/* Top badges */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        <div className="flex flex-wrap gap-2">
          {card.compatibility != null && (
            <Badge tone="brand" className="backdrop-blur">
              💘 {card.compatibility}% Match
            </Badge>
          )}
          {card.isSuperLike && (
            <Badge tone="gold" className="backdrop-blur">
              🌟 Super Like
            </Badge>
          )}
          {card.isBoosted && (
            <Badge tone="purple" className="backdrop-blur bg-violet2-500/30 border-violet2-400/40 text-violet2-300">
              🚀 Boosted
            </Badge>
          )}
        </div>
        {card.distanceKm != null && (
          <Badge tone="blur">📍 {card.distanceKm} km</Badge>
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
            <h2 className="font-display text-3xl font-bold">
              {showBlurred && card.blurred ? '???' : card.name}
              {card.age != null && !card.blurred && (
                <span className="text-white/80 font-sans font-normal text-2xl">
                  {' '}
                  {card.age}
                </span>
              )}
            </h2>
            {card.isVerified && <VerifiedBadge className="mb-2" />}
          </div>
          <div className="text-white/70 text-sm mt-0.5">
            {card.city}
            {card.intentionLabel && !card.blurred && (
              <>
                {' · '}
                <span className="text-rose-300">{card.intentionLabel}</span>
              </>
            )}
          </div>

          {!card.blurred && (
            <p className="text-white/70 text-sm mt-2 line-clamp-2">
              {card.bio}
            </p>
          )}

          {!card.blurred && card.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {card.interests.slice(0, 5).map((i) => (
                <span
                  key={i.id}
                  className="chip bg-white/10 border-white/15 text-xs backdrop-blur"
                >
                  {i.emoji} {i.name}
                </span>
              ))}
              {card.interests.length > 5 && (
                <span className="chip bg-white/10 border-white/15 text-xs">
                  +{card.interests.length - 5}
                </span>
              )}
            </div>
          )}

          {card.blurred && (
            <div className="mt-3 text-sm text-white/60">
              🔒 Upgrade to Premium to see who liked you
            </div>
          )}
        </button>
      </div>
    </motion.div>
  );
}
