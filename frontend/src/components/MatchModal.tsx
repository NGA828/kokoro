'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, MessageCircle } from 'lucide-react';
import { mediaUrl } from '@/lib/api';
import { useAuth } from '@/lib/store';

function RingAvatar({
  src,
  name,
  side,
}: {
  src: string | null;
  name: string;
  side: 'left' | 'right';
}) {
  return (
    <motion.div
      initial={{ scale: 0, x: side === 'left' ? -80 : 80, rotate: side === 'left' ? -12 : 12 }}
      animate={{ scale: 1, x: 0, rotate: side === 'left' ? -8 : 8 }}
      transition={{ delay: 0.25, type: 'spring', stiffness: 200, damping: 16 }}
      className={`relative w-32 h-32 sm:w-40 sm:h-40 rounded-full p-[3px] bg-brand-gradient shadow-glow ${
        side === 'left' ? '-mr-6 sm:-mr-8' : '-ml-6 sm:-ml-8 z-10'
      }`}
    >
      <div className="w-full h-full rounded-full overflow-hidden bg-ink-800 border-2 border-ink-900">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(src)} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-brand-gradient flex items-center justify-center text-white text-4xl font-bold">
            {name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
          </div>
        )}
      </div>
    </motion.div>
  );
}

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
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      {/* backdrop with glow */}
      <div className="absolute inset-0 bg-ink-950/90 backdrop-blur-md" />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgba(255,61,143,0.25), transparent 55%), radial-gradient(circle at 50% 60%, rgba(139,77,255,0.2), transparent 60%)',
        }}
      />

      {/* rising hearts */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute text-rose-400 pointer-events-none"
          style={{ left: `${8 + i * 8}%`, bottom: '10%' }}
          initial={{ y: 0, opacity: 0, scale: 0.4 }}
          animate={{ y: -380 - (i % 4) * 60, opacity: [0, 0.9, 0], scale: 0.5 + (i % 3) * 0.25, rotate: (i % 2 ? 1 : -1) * 20 }}
          transition={{ duration: 3.2, delay: i * 0.25, repeat: Infinity, ease: 'easeOut' }}
        >
          <Heart size={16 + (i % 3) * 8} fill="currentColor" />
        </motion.span>
      ))}

      <motion.div
        initial={{ scale: 0.7, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
        onClick={(e) => e.stopPropagation()}
        className="relative text-center max-w-sm w-full"
      >
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
          className="flex items-center justify-center gap-0 mb-8"
        >
          <RingAvatar src={null} name={user?.name ?? 'You'} side="left" />
          <motion.div
            animate={{ scale: [1, 1.18, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="relative z-20 w-14 h-14 rounded-full bg-white text-rose-500 flex items-center justify-center shadow-glow border-4 border-ink-950 -mx-2"
          >
            <Heart size={26} fill="currentColor" />
          </motion.div>
          <RingAvatar src={photo} name={name} side="right" />
        </motion.div>

        <h2 className="font-display text-4xl font-bold mb-2 flex items-center justify-center gap-2">
          It&rsquo;s a Match!
          <Heart size={30} className="text-rose-400" fill="currentColor" />
        </h2>
        <p className="text-white/70 mb-8">
          You and <b className="text-rose-300">{name}</b> liked each other.
        </p>

        <div className="space-y-3">
          <motion.button
            whileTap={{ scale: 0.96 }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand-gradient text-white font-semibold px-6 py-3.5 shadow-glow"
            onClick={() =>
              router.push(
                conversationId ? `/app/messages/${conversationId}` : '/app/matches',
              )
            }
          >
            <MessageCircle size={19} /> Send a Message
          </motion.button>
          <button
            className="w-full rounded-full border border-white/20 text-white/80 font-medium px-6 py-3.5 hover:bg-white/5 transition"
            onClick={onClose}
          >
            Keep Swiping
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
