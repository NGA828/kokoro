'use client';

import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '@/lib/api';
import type { LucideIcon } from 'lucide-react';
import { Users, Activity, UserPlus, HeartHandshake, MessageCircle, Crown, ShieldAlert, Banknote } from 'lucide-react';
import { PageHeader, Skeleton } from '@/components/ui';

interface Stats {
  cards: Record<string, number>;
  signupsSeries: { date: string; value: number }[];
  matchesSeries: { date: string; value: number }[];
  messagesSeries: { date: string; value: number }[];
  genderSplit: { name: string; value: number }[];
}

const GENDER_COLORS: Record<string, string> = {
  female: '#ff3d8f',
  male: '#8b4dff',
  other: '#3dd6ff',
};

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  const cards: { label: string; value: number; icon: LucideIcon; color: string }[] = [
    { label: 'Total users', value: stats.cards.totalUsers, icon: Users, color: '#ff3d8f' },
    { label: 'Active (7d)', value: stats.cards.activeUsers, icon: Activity, color: '#34d399' },
    { label: 'New (30d)', value: stats.cards.newUsers30, icon: UserPlus, color: '#3dd6ff' },
    { label: 'Matches', value: stats.cards.totalMatches, icon: HeartHandshake, color: '#c92bb0' },
    { label: 'Messages', value: stats.cards.totalMessages, icon: MessageCircle, color: '#8b4dff' },
    { label: 'Premium users', value: stats.cards.premiumUsers, icon: Crown, color: '#fbbf24' },
    { label: 'Open reports', value: stats.cards.openReports, icon: ShieldAlert, color: '#f87171' },
    { label: 'Revenue', value: stats.cards.revenue, icon: Banknote, color: '#34d399' },
  ];

  return (
    <div>
      <PageHeader title="Platform overview" subtitle="Live data from Kokoro March." />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3" style={{ background: `${c.color}1f`, color: c.color }}>
              <c.icon size={19} />
            </div>
            <div className="font-display text-2xl font-bold">
              {c.value.toLocaleString()}
            </div>
            <div className="text-xs text-white/50">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4">Growth — last 30 days</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.signupsSeries}>
              <defs>
                <linearGradient id="c1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff3d8f" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#ff3d8f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" hide />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: '#1b1430',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#ff3d8f"
                fill="url(#c1)"
                strokeWidth={2}
                name="Cumulative signups"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold mb-4">Gender split</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={stats.genderSplit}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {stats.genderSplit.map((g) => (
                  <Cell key={g.name} fill={GENDER_COLORS[g.name] || '#888'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#1b1430',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs">
            {stats.genderSplit.map((g) => (
              <span key={g.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: GENDER_COLORS[g.name] || '#888' }}
                />
                {g.name} ({g.value})
              </span>
            ))}
          </div>
        </div>

        <div className="card p-6 lg:col-span-3">
          <h3 className="font-semibold mb-4">Engagement — matches & messages</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={stats.matchesSeries.map((m, i) => ({
              date: m.date,
              matches: m.value,
              messages: stats.messagesSeries[i]?.value ?? 0,
            }))}>
              <defs>
                <linearGradient id="c2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b4dff" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#8b4dff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" hide />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: '#1b1430',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                }}
              />
              <Area type="monotone" dataKey="messages" stroke="#8b4dff" fill="url(#c2)" strokeWidth={2} name="Messages" />
              <Area type="monotone" dataKey="matches" stroke="#ff3d8f" fill="transparent" strokeWidth={2} name="Matches" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
