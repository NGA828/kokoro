'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';
import { mediaUrl } from '@/lib/api';

export function HeartMark({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 21s-7.5-4.6-10-9.2C.4 8.7 1.9 5 5.3 5c2 0 3.4 1.1 4.2 2.4h.2C10.5 6.1 11.9 5 13.9 5c3.4 0 4.9 3.7 3.3 6.8C19.6 16.4 12 21 12 21z" />
    </svg>
  );
}

export function Logo({
  size = 'md',
  href,
}: {
  size?: 'sm' | 'md' | 'lg';
  href?: string;
}) {
  const box =
    size === 'sm' ? 'w-9 h-9 rounded-xl' : size === 'lg' ? 'w-13 h-13 rounded-2xl' : 'w-11 h-11 rounded-2xl';
  const heart =
    size === 'sm' ? 'w-4.5 h-4.5' : size === 'lg' ? 'w-7 h-7' : 'w-6 h-6';
  const text =
    size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
  const mark = (
    <span className="flex items-center gap-2.5 font-display">
      <span
        className={`${box} bg-brand-gradient flex items-center justify-center shadow-glow text-white`}
      >
        <HeartMark className={heart} />
      </span>
      <span className={`${text} font-bold tracking-tight leading-none`}>
        Kokoro <span className="text-gradient italic font-semibold">March</span>
      </span>
    </span>
  );
  if (href) return <Link href={href}>{mark}</Link>;
  return mark;
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'white' | 'danger';
}) {
  const cls =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'white'
        ? 'btn-white'
        : variant === 'danger'
          ? 'btn bg-red-500/90 text-white px-6 py-3 hover:bg-red-500 active:scale-95'
          : 'btn-ghost';
  return (
    <button className={`${cls} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function IconButton({
  children,
  className = '',
  tone = 'default',
  size = 48,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'default' | 'pink' | 'rose' | 'blue' | 'purple' | 'gold';
  size?: number;
}) {
  const tones: Record<string, string> = {
    default: 'bg-white/10 text-white hover:bg-white/20 border border-white/15',
    pink: 'bg-white text-rose-500 hover:bg-rose-50 shadow-glow',
    rose: 'bg-rose-500 text-white hover:bg-rose-600 shadow-glow',
    blue: 'bg-white text-sky-500 hover:bg-sky-50',
    purple: 'bg-white text-violet2-500 hover:bg-violet2-50 shadow-glow-violet',
    gold: 'bg-white text-amber-500 hover:bg-amber-50',
  };
  return (
    <button
      style={{ width: size, height: size }}
      className={`rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 disabled:opacity-40 disabled:pointer-events-none backdrop-blur ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin ${className}`}
    />
  );
}

export function Badge({
  children,
  tone = 'default',
  className = '',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'brand' | 'green' | 'gold' | 'purple' | 'blur';
  className?: string;
}) {
  const tones: Record<string, string> = {
    default: 'bg-white/10 border-white/15 text-white/90',
    brand: 'bg-rose-500/20 border-rose-400/40 text-rose-300',
    green: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300',
    gold: 'bg-amber-500/15 border-amber-400/30 text-amber-300',
    purple: 'bg-violet2-500/25 border-violet2-400/40 text-violet2-300',
    blur: 'bg-ink-900/70 border-white/10 text-white/80 backdrop-blur',
  };
  return (
    <span className={`chip ${tones[tone]} ${className}`}>{children}</span>
  );
}

export function Avatar({
  src,
  name,
  size = 48,
  className = '',
  blur = false,
}: {
  src: string | null | undefined;
  name: string;
  size?: number;
  className?: string;
  blur?: boolean;
}) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const style = { width: size, height: size };
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={mediaUrl(src)}
        alt={name}
        style={style}
        className={`rounded-2xl object-cover ${blur ? 'blur-lg scale-110' : ''} ${className}`}
      />
    );
  }
  return (
    <div
      style={style}
      className={`rounded-2xl bg-brand-gradient flex items-center justify-center text-white font-bold ${className}`}
    >
      <span style={{ fontSize: size * 0.36 }}>{initials}</span>
    </div>
  );
}

export function Photo({
  src,
  alt,
  className = '',
  blur = false,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  blur?: boolean;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={mediaUrl(src)}
        alt={alt}
        className={`w-full h-full object-cover ${blur ? 'blur-2xl scale-110 brightness-75' : ''} ${className}`}
      />
    );
  }
  return (
    <div className="w-full h-full bg-brand-gradient flex items-center justify-center">
      <span className="text-6xl opacity-80 font-display">
        {alt.split(' ').map((p) => p[0]).slice(0, 2).join('')}
      </span>
    </div>
  );
}

export function VerifiedBadge({ className = '' }: { className?: string }) {
  return (
    <span
      title="Verified profile"
      className={`inline-flex items-center justify-center rounded-full text-sky-400 ${className}`}
    >
      <BadgeCheck className="w-5 h-5" fill="rgba(56,189,248,0.15)" />
    </span>
  );
}

export function EmptyState({
  icon: IconCmp,
  title,
  body,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  const Icon = IconCmp ?? HeartMark;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-10 text-center flex flex-col items-center gap-4"
    >
      <div className="relative">
        <span
          className="absolute inset-0 rounded-full blur-xl opacity-60"
          style={{ background: 'radial-gradient(circle, rgba(255,61,143,0.4), transparent 70%)' }}
        />
        <div className="relative w-20 h-20 rounded-full bg-brand-gradient-soft border border-rose-400/20 flex items-center justify-center">
          <Icon className="w-9 h-9 text-rose-300" />
        </div>
      </div>
      <h3 className="font-display text-xl">{title}</h3>
      {body && <p className="text-white/60 max-w-md leading-relaxed">{body}</p>}
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-2xl ${className}`} />;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
      <div>
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        {subtitle && <p className="text-white/60 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
