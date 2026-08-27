'use client';

import { BadgeCheck, Check } from 'lucide-react';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Avatar, Button, EmptyState, PageHeader, Skeleton } from '@/components/ui';

interface Pending {
  userId: string;
  name: string;
  city: string | null;
  mainPhotoUrl: string | null;
  verificationRequestedAt: string;
}

export default function VerificationsPage() {
  const [items, setItems] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .get('/admin/verifications')
      .then(({ data }) => setItems(data ?? []))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function decide(userId: string, status: 'verified' | 'rejected') {
    await api.post(`/admin/users/${userId}/verification`, { status });
    load();
  }

  return (
    <div>
      <PageHeader title="Verifications" subtitle="Approve trusted profiles." />
      {loading ? (
        <Skeleton className="h-64" />
      ) : items.length === 0 ? (
        <EmptyState icon={BadgeCheck} title="No pending requests" body="All caught up." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => (
            <div key={p.userId} className="card p-5 text-center">
              <div className="flex justify-center mb-3">
                <Avatar src={p.mainPhotoUrl} name={p.name} size={80} />
              </div>
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-white/50 mb-4">{p.city}</div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1 !py-2 text-sm"
                  onClick={() => decide(p.userId, 'rejected')}
                >
                  Reject
                </Button>
                <Button
                  className="flex-1 !py-2 text-sm"
                  onClick={() => decide(p.userId, 'verified')}
                >
                  <Check size={15} className="inline mr-1 -mt-0.5" /> Verify
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
