'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { mediaUrl } from '@/lib/api';

export function Logo({
  size = 'md',
  href,
}: {
  size?: 'sm' | 'md' | 'lg';
  href?: string;
}) {
  const dims =
    size === 'sm' ? 'w-8 h-8 text-lg' : size === 'lg' ? 'w-12 h-12 text-2xl' : 'w-10 h-10 text-xl';
  const text =
    size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
  const mark = (
    <span className="flex items-center gap-2.5 font-display">
      <span
        className={`${dims} rounded-2xl bg-brand-gradient flex items-center justify-center shadow-glow text-white`}
      >
        心
      </span>
      <span className={`${text} font-bold tracking-tight`}>
        Kokoro <span className="text-gradient">March</span>
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
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full bg-sky-400 text-white text-[11px] ${className}`}
    >
      ✓
    </span>
  );
}

export function EmptyState({
  icon = '💫',
  title,
  body,
  action,
}: {
  icon?: string;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-10 text-center flex flex-col items-center gap-3"
    >
      <div className="text-5xl">{icon}</div>
      <h3 className="font-display text-xl">{title}</h3>
      {body && <p className="text-white/60 max-w-md">{body}</p>}
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
