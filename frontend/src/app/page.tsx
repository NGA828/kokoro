'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus,
  Sparkles,
  Users,
  MessageCircle,
  Target,
  Flower2,
  ShieldCheck,
  Crown,
  Globe,
  Heart,
  BadgeCheck,
  Check,
  Ban,
  Flag,
  Lock,
  Star,
  Quote,
} from 'lucide-react';
import { Logo } from '@/components/ui';

const steps = [
  { icon: Sparkles, title: 'Create your profile',
    body: 'Tell us about you — your interests, what you are looking for, and the moments you want to share.' },
  { icon: Users, title: 'Discover compatible people',
    body: 'Meet real people near you through a transparent compatibility score based on interests, goals and preferences.' },
  { icon: MessageCircle, title: 'Match & connect',
    body: 'When the feeling is mutual, it is a match. Chat in real time and turn a spark into something lasting.' },
];

const features = [
  { icon: Target, title: 'Meaningful compatibility', body: 'See exactly why you match — shared interests, relationship goals, location and more.' },
  { icon: MessageCircle, title: 'Real-time chat', body: 'Instant messaging, typing indicators, read receipts, photo and voice notes.' },
  { icon: Flower2, title: 'Personality first', body: 'From afrobeats to anime — express what makes you, you.' },
  { icon: ShieldCheck, title: 'Safety by design', body: 'Block, report, verified profiles and full privacy controls in your hands.' },
  { icon: Crown, title: 'Premium powers', body: 'See who liked you, unlimited likes, super likes, boosts and advanced filters.' },
  { icon: Globe, title: 'Made for Africa', body: 'Built around African cities, culture and mobile-money ready payments.' },
];

const faqs = [
  {
    q: 'Who can join Kokoro March?',
    a: 'Kokoro March is an 18+ platform for adults across Africa (and beyond) looking for meaningful romantic connections — from friendship-first to long-term relationships.',
  },
  {
    q: 'How does matching work?',
    a: 'Matching is always mutual: a match is created only when two people like each other. Your compatibility percentage is calculated from shared interests, relationship goals, preferences, location and profile quality — never randomly.',
  },
  {
    q: 'Is my location shared precisely?',
    a: 'No. We only show your city or an approximate distance, and you can hide distance or your profile entirely from your privacy settings.',
  },
  {
    q: 'How do you keep members safe?',
    a: 'You can block or report anyone at any time. Reports go straight to our moderation team, and verified profiles carry a trusted badge.',
  },
  {
    q: 'What does Premium include?',
    a: 'Unlimited likes, see who liked you, weekly Super Likes, profile boosts, advanced filters and richer compatibility insights.',
  },
];

const testimonials = [
  { name: 'Amara & Kwame', city: 'Lagos ↔ Accra', body: 'We matched over our love for afrobeats and travel. Three months later, he flew to Lagos. Best hello ever.' },
  { name: 'Zanele', city: 'Johannesburg', body: 'The compatibility scores felt real. Every match actually had things in common with me.' },
  { name: 'Fatou', city: 'Dakar', body: 'I loved that I could be myself — fashion, anime, all of it. The conversations never feel shallow.' },
];

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Logo href="/" />
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
            <a href="#how" className="hover:text-white transition">How it works</a>
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#safety" className="hover:text-white transition">Safety</a>
            <a href="#premium" className="hover:text-white transition">Premium</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex btn-ghost !py-2 !px-5 text-sm"
            >
              Log in
            </Link>
            <Link href="/register" className="btn-primary !py-2 !px-5 text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-28 pb-16">
        <div className="absolute inset-0 bg-radial-glow pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="chip bg-brand-gradient-soft border-rose-400/30 text-rose-200 mb-6">
              African connections, meaningful love
            </span>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6">
              Find love.<br />
              <span className="text-gradient">Share moments.</span><br />
              Build forever.
            </h1>
            <p className="text-lg text-white/70 max-w-xl mb-8 leading-relaxed">
              A space where real connections begin with shared interests, genuine
              conversations, and meaningful moments. Discover someone who truly
              connects with you.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/register" className="btn-primary text-lg !px-8 !py-4">
                Start your journey
              </Link>
              <Link href="/login" className="btn-ghost text-lg !px-8 !py-4">
                I already have an account
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-10 text-sm text-white/50">
              <span className="inline-flex items-center gap-1.5"><Heart size={14} className="text-rose-400" fill="currentColor" /> Compatibility-based</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-400" /> Safe & verified</span>
              <span className="inline-flex items-center gap-1.5"><Globe size={14} className="text-sky-400" /> 18+ across Africa</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative"
          >
            <div className="absolute -inset-6 bg-brand-gradient opacity-30 blur-3xl rounded-full" />
            <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 shadow-card aspect-[4/5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero-couple.png"
                alt="A happy young African couple sharing a moment"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
            </div>
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute -left-4 sm:-left-10 top-10 glass rounded-2xl px-4 py-3 flex items-center gap-3"
            >
              <span className="w-9 h-9 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <Heart size={17} fill="currentColor" />
              </span>
              <div>
                <div className="font-semibold text-sm">93% Match</div>
                <div className="text-xs text-white/60">Shared: afrobeats, travel</div>
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
              className="absolute -right-2 sm:-right-8 bottom-16 glass rounded-2xl px-4 py-3 flex items-center gap-3"
            >
              <span className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <BadgeCheck size={17} />
              </span>
              <div>
                <div className="font-semibold text-sm">New message</div>
                <div className="text-xs text-white/60">“Hi! I loved your profile”</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeading
            eyebrow="How it works"
            title="Three steps to something real"
            sub="No endless, mindless swiping. Just compatible people and genuine conversation."
          />
          <div className="grid md:grid-cols-3 gap-6 mt-14">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="card p-8"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand-gradient flex items-center justify-center mb-5 shadow-glow text-white">
                  <s.icon size={26} />
                </div>
                <div className="text-sm text-rose-300 font-semibold mb-1">
                  Step {i + 1}
                </div>
                <h3 className="font-display text-2xl mb-3">{s.title}</h3>
                <p className="text-white/60 leading-relaxed">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeading
            eyebrow="Why Kokoro March"
            title="Built for connections that last"
            sub="Every feature is designed to help you discover and grow a real relationship."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-14">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.1 }}
                className="card p-7 hover:border-rose-400/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-gradient-soft border border-rose-400/20 flex items-center justify-center mb-4 text-rose-300">
                  <f.icon size={22} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety */}
      <section id="safety" className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="card p-10 sm:p-14 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="relative grid md:grid-cols-2 gap-10 items-center">
              <div>
                <span className="chip bg-emerald-500/15 border-emerald-400/30 text-emerald-300 mb-4">
                  Safety first
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
                  Your safety is non-negotiable
                </h2>
                <p className="text-white/60 leading-relaxed mb-6">
                  Love should feel safe. Kokoro March gives you full control with
                  blocking, reporting, verified profiles and granular privacy
                  settings — backed by a real moderation team.
                </p>
                <ul className="space-y-3 text-white/80">
                  {[
                    'Block anyone instantly — they disappear and cannot contact you',
                    'Report fake profiles, harassment, scams or spam',
                    'Verified profiles earn a trusted blue badge',
                    'Control your visibility, distance and online status',
                  ].map((t) => (
                    <li key={t} className="flex gap-3">
                      <Check size={17} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-sm">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Ban, label: 'Block', color: '#f87171' },
                  { icon: Flag, label: 'Report', color: '#fbbf24' },
                  { icon: BadgeCheck, label: 'Verified', color: '#38bdf8' },
                  { icon: Lock, label: 'Privacy', color: '#a875ff' },
                ].map((x) => (
                  <div
                    key={x.label}
                    className="aspect-square rounded-3xl glass flex flex-col items-center justify-center gap-2 text-center text-lg font-semibold p-4"
                  >
                    <x.icon size={30} style={{ color: x.color }} />
                    {x.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium */}
      <section id="premium" className="py-24 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <SectionHeading
            eyebrow="Kokoro Premium"
            title="Go further with Premium"
            sub="More chances, more control, more insight — while the core experience stays free."
          />
          <div className="grid sm:grid-cols-2 gap-6 mt-14 text-left">
            <div className="card p-8">
              <h3 className="font-display text-2xl mb-1">Free</h3>
              <p className="text-white/50 mb-6">Everything you need to meet someone</p>
              <ul className="space-y-3 text-sm text-white/70">
                {['Discovery & compatibility scores','10 likes per day','Real-time matches & chat','Block, report & privacy controls'].map((x) => (
                  <li key={x} className="flex items-center gap-2"><Check size={14} className="text-emerald-400 shrink-0" />{x}</li>
                ))}
              </ul>
            </div>
            <div className="card p-8 border-rose-400/40 relative bg-brand-gradient-soft">
              <span className="absolute -top-3 right-6 chip bg-brand-gradient border-transparent text-white text-xs">
                Most popular
              </span>
              <h3 className="font-display text-2xl mb-1 text-gradient">Premium</h3>
              <p className="text-white/50 mb-6">For those ready for more</p>
              <ul className="space-y-3 text-sm text-white/80">
                {['Unlimited likes & weekly Super Likes','See who liked you','Profile boosts & advanced filters','Advanced compatibility insights','Undo swipes & profile themes'].map((x) => (
                  <li key={x} className="flex items-center gap-2"><Check size={14} className="text-rose-400 shrink-0" />{x}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SectionHeading eyebrow="Real stories" title="Love, shared out loud" />
          <div className="grid md:grid-cols-3 gap-6 mt-14">
            {testimonials.map((t) => (
              <div key={t.name} className="card p-8">
                <Quote size={28} className="text-rose-400 mb-4" fill="currentColor" />
                <p className="text-white/80 leading-relaxed italic mb-6">
                  “{t.body}”
                </p>
                <div className="font-semibold">{t.name}</div>
                <div className="text-sm text-white/50">{t.city}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <SectionHeading eyebrow="FAQ" title="Questions, answered" />
          <div className="mt-12 space-y-3">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="card p-5 group open:bg-white/[0.07] transition-colors"
              >
                <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                  {f.q}
                  <Plus size={20} className="text-rose-400 transition-transform group-open:rotate-45" />
                </summary>
                <p className="text-white/60 mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="card p-12 sm:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-brand-gradient opacity-20" />
            <div className="relative">
              <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
                Your person could be one hello away.
              </h2>
              <p className="text-white/70 mb-8 max-w-xl mx-auto">
                Join Kokoro March today. It is free to start, and your next great
                conversation might already be waiting.
              </p>
              <Link href="/register" className="btn-primary text-lg !px-10 !py-4">
                Get Started — it is free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid sm:grid-cols-4 gap-8">
          <div className="sm:col-span-2">
            <Logo />
            <p className="text-white/50 text-sm mt-4 max-w-sm">
              Find love. Share moments. Build forever. A modern African dating
              platform for meaningful connections.
            </p>
          </div>
          <div>
            <div className="font-semibold mb-3 text-sm">Product</div>
            <ul className="space-y-2 text-sm text-white/50">
              <li><a href="#how" className="hover:text-white">How it works</a></li>
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="#premium" className="hover:text-white">Premium</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-3 text-sm">Company</div>
            <ul className="space-y-2 text-sm text-white/50">
              <li><a href="#safety" className="hover:text-white">Safety</a></li>
              <li><a href="#faq" className="hover:text-white">FAQ</a></li>
              <li><Link href="/login" className="hover:text-white">Log in</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-10 text-xs text-white/30 flex justify-between">
          <span>© {new Date().getFullYear()} Kokoro March. 18+ only.</span>
          <span className="inline-flex items-center gap-1.5">Made with <Heart size={11} className="text-rose-400" fill="currentColor" /> in Africa</span>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center max-w-2xl mx-auto"
    >
      <div className="text-rose-400 font-semibold text-sm uppercase tracking-widest mb-3">
        {eyebrow}
      </div>
      <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">{title}</h2>
      {sub && <p className="text-white/60">{sub}</p>}
    </motion.div>
  );
}
