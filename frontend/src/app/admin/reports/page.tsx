'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Avatar, Badge, Button, EmptyState, PageHeader, Skeleton } from '@/components/ui';

interface Report {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .get('/admin/reports')
      .then(({ data }) => setReports(data))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function resolve(id: string, status: string) {
    await api.post(`/admin/reports/${id}/resolve`, { status });
    load();
  }

  return (
    <div>
      <PageHeader title="Reports 🚨" subtitle="Member safety queue." />
      {loading ? (
        <Skeleton className="h-64" />
      ) : reports.length === 0 ? (
        <EmptyState icon="🛡️" title="No reports" body="The community is safe and sound." />
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="card p-5 flex flex-wrap items-center gap-4">
              <Avatar src={null} name={r.reportedId} size={44} />
              <div className="flex-1 min-w-[200px]">
                <div className="font-semibold flex items-center gap-2">
                  {r.reason.replace('_', ' ')}
                  <Badge tone={r.status === 'open' ? 'brand' : 'default'}>
                    {r.status}
                  </Badge>
                </div>
                {r.details && <div className="text-sm text-white/60">{r.details}</div>}
                <div className="text-xs text-white/40 mt-1">
                  {new Date(r.createdAt).toLocaleString()} · user {r.reportedId.slice(0, 8)}
                </div>
              </div>
              {r.status === 'open' && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="!py-2 text-sm"
                    onClick={() => resolve(r.id, 'dismissed')}
                  >
                    Dismiss
                  </Button>
                  <Button
                    variant="danger"
                    className="!py-2 text-sm"
                    onClick={() => resolve(r.id, 'resolved')}
                  >
                    Resolve & warn
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
