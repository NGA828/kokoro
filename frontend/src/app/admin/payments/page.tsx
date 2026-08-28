'use client';

import { CreditCard } from 'lucide-react';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Badge, EmptyState, PageHeader, Skeleton } from '@/components/ui';

interface Payment {
  id: string;
  kind: string;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/payments')
      .then(({ data }) => setPayments(data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const revenue = payments
    .filter((p) => p.status === 'succeeded')
    .reduce((a, p) => a + p.amount, 0);

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle={`Processed revenue: ${revenue.toLocaleString()} XAF`}
      />
      {loading ? (
        <Skeleton className="h-64" />
      ) : payments.length === 0 ? (
        <EmptyState icon={CreditCard} title="No payments yet" />
      ) : (
        <div className="card divide-y divide-white/5 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-white/50">
                <th className="p-4">Date</th>
                <th className="p-4">Kind</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Provider</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-white/5">
                  <td className="p-4 text-white/60">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">{p.kind}</td>
                  <td className="p-4 font-semibold">
                    {p.amount.toLocaleString()} {p.currency}
                  </td>
                  <td className="p-4 text-white/60">{p.provider}</td>
                  <td className="p-4">
                    <Badge tone={p.status === 'succeeded' ? 'green' : p.status === 'pending' ? 'gold' : 'default'}>
                      {p.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
