'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Avatar, Button } from '@/components/ui';
import { useAuth } from '@/lib/store';

export function MatchModal({
  name,
  photo,
  conversationId,
  onClose,
}: {
  name: string;
  photo: string | null;
  conversationId?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const user = useAuth((s) => s.user);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/85 backdrop-blur-md p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.7, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        onClick={(e) => e.stopPropagation()}
        className="relative text-center max-w-sm w-full"
      >
        {/* Floating hearts */}
        {['💖', '💗', '✨', '🌸', '💞'].map((h, i) => (
          <span
            key={i}
            className="absolute text-3xl heart-float"
            style={{
              left: `${10 + i * 20}%`,
              top: `${-10 - (i % 3) * 14}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            {h}
          </span>
        ))}

        <div className="card p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-gradient opacity-15" />
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              className="text-6xl mb-4"
            >
              ❤️
            </motion.div>
            <h2 className="font-display text-4xl font-bold mb-2">
              It’s a Match!
            </h2>
            <p className="text-white/70 mb-8">
              You and <b className="text-rose-300">{name}</b> liked each other.
            </p>

            <div className="flex items-center justify-center gap-4 mb-8">
              <Avatar src={photo} name={name} size={96} className="rotate-[-6deg]" />
              <Avatar
                src={null}
                name={user?.name ?? 'You'}
                size={96}
                className="rotate-[6deg]"
              />
            </div>

            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={() =>
                  router.push(
                    conversationId ? `/app/messages/${conversationId}` : '/app/matches',
                  )
                }
              >
                💬 Send a message
              </Button>
              <Button variant="ghost" className="w-full" onClick={onClose}>
                Keep discovering
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
