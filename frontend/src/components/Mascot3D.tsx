'use client';

import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Sparkles, X } from 'lucide-react';

class MascotBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function MascotFallback() {
  // Friendly 2D companion if WebGL is unavailable
  return (
    <div className="w-full h-full flex items-end justify-center">
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] bg-brand-gradient shadow-glow flex items-center justify-center"
      >
        <Heart size={36} className="text-white" fill="currentColor" />
      </motion.div>
    </div>
  );
}

const MascotScene = dynamic(() => import('./mascot/MascotScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-end justify-center">
      <span className="w-14 h-14 mb-4 rounded-full border-2 border-rose-400/30 border-t-rose-400 animate-spin" />
    </div>
  ),
});

type Reaction = 'idle' | 'wave' | 'love' | 'happy';

const LINES: Record<Exclude<Reaction, 'idle'>, string[]> = {
  wave: [
    'Hey there! Welcome back to Kokoro March.',
    'Hi! Tap me anytime you need a little boost.',
    "You've got this — someone great is out there!",
  ],
  love: [
    "It's a match! Go on, say hi first.",
    'Love is in the air! Send that first message.',
    'A new connection just sparked. Make it count!',
  ],
  happy: [
    'You look amazing today!',
    'Tip: a complete profile gets way more likes.',
    'Keep swiping — your person might be next!',
    'Remember: be kind, be real, be you.',
  ],
};

const CYCLE: Exclude<Reaction, 'idle'>[] = ['wave', 'happy', 'love'];

export function Mascot3D() {
  const [reaction, setReaction] = useState<Reaction>('idle');
  const [burstId, setBurstId] = useState(0);
  const [bubble, setBubble] = useState<string | null>(null);
  const [hintDismissed, setHintDismissed] = useState(false);
  const idx = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trigger = useCallback((r: Exclude<Reaction, 'idle'>, line?: string) => {
    setReaction(r);
    setBurstId((n) => n + 1);
    setBubble(line ?? LINES[r][Math.floor(Math.random() * LINES[r].length)]);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setReaction('idle');
      setBubble(null);
    }, 3800);
  }, []);

  const onClick = useCallback(() => {
    trigger(CYCLE[idx.current % CYCLE.length]);
    idx.current += 1;
  }, [trigger]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!hintDismissed) trigger('wave');
    }, 2400);
    return () => clearTimeout(t);
  }, [trigger, hintDismissed]);

  useEffect(() => {
    const onMatch = () => trigger('love');
    window.addEventListener('km:match', onMatch);
    return () => window.removeEventListener('km:match', onMatch);
  }, [trigger]);

  return (
    <div
      className="fixed z-[70] bottom-[76px] lg:bottom-6 right-2 sm:right-6 select-none"
      style={{ pointerEvents: 'none' }}
      aria-hidden={false}
    >
      <div className="relative" style={{ pointerEvents: 'auto' }}>
        <AnimatePresence>
          {bubble && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              className="absolute bottom-full right-0 mb-2 w-56 sm:w-64"
            >
              <button
                onClick={() => {
                  setHintDismissed(true);
                  setBubble(null);
                  setReaction('idle');
                }}
                className="absolute -top-2 -left-2 z-10 w-6 h-6 rounded-full bg-ink-700 border border-white/20 text-white/70 flex items-center justify-center hover:text-white transition"
                aria-label="Dismiss"
              >
                <X size={12} />
              </button>
              <div className="glass-strong rounded-2xl rounded-br-md px-4 py-3 text-sm text-white/90 shadow-card border border-white/15 leading-relaxed">
                {bubble}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {reaction === 'idle' && !bubble && (
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ boxShadow: '0 0 0 2px rgba(255,61,143,0.35)' }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <button
          onClick={onClick}
          aria-label="Kokori, your companion — tap for a reaction"
          className="block relative w-[104px] h-[128px] sm:w-[132px] sm:h-[160px] cursor-pointer focus:outline-none group"
        >
          <span
            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-20 h-6 rounded-[100%] blur-md"
            style={{
              background:
                'radial-gradient(ellipse, rgba(139,77,255,0.55), transparent 70%)',
            }}
          />
          <span className="absolute inset-0 animate-float-slow transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
            <MascotBoundary fallback={<MascotFallback />}>
              <MascotScene reaction={reaction} burstId={burstId} />
            </MascotBoundary>
          </span>
        </button>

        <div className="flex justify-center -mt-1">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-widest uppercase text-white/60 bg-ink-900/70 border border-white/10 rounded-full px-2.5 py-0.5 backdrop-blur">
            <Heart size={9} className="text-rose-400" fill="currentColor" />
            Kokori
            <Sparkles size={9} className="text-violet2-300" />
          </span>
        </div>
      </div>
    </div>
  );
}
