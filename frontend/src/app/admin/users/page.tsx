'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Avatar, Badge, PageHeader, Skeleton } from '@/components/ui';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  verification: string;
  isPremium: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  lastActiveAt: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  function load(p = 1, q = '') {
    setLoading(true);
    api
      .get(`/admin/users?page=${p}&search=${encodeURIComponent(q)}`)
      .then(({ data }) => {
        setUsers(data.items);
        setTotal(data.total);
        setPage(data.page);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const t = setTimeout(() => load(1, search), 300);
    return () => clearTimeout(t);
  }, [search]);

  async function setStatus(id: string, status: string) {
    await api.post(`/admin/users/${id}/status`, { status });
    load(page, search);
  }

  return (
    <div>
      <PageHeader title="Users " subtitle={`${total} accounts`} />
      <input
        className="input mb-5 max-w-sm"
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : (
        <div className="card divide-y divide-white/5 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-white/50">
                <th className="p-4 font-medium">Member</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Verified</th>
                <th className="p-4 font-medium">Joined</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar src={null} name={u.name} size={40} />
                      <div>
                        <div className="font-semibold flex items-center gap-1.5">
                          {u.name}
                          {u.role === 'admin' && <Badge tone="gold">Admin</Badge>}
                          {u.isPremium && <Badge tone="brand">Premium</Badge>}
                        </div>
                        <div className="text-xs text-white/50">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge
                      tone={
                        u.status === 'active'
                          ? 'green'
                          : u.status === 'deactivated'
                            ? 'gold'
                            : 'default'
                      }
                    >
                      {u.status}
                    </Badge>
                  </td>
                  <td className="p-4">{u.verification}</td>
                  <td className="p-4 text-white/60">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <select
                      className="input !py-1.5 !w-auto text-sm [color-scheme:dark]"
                      value=""
                      onChange={(e) => e.target.value && setStatus(u.id, e.target.value)}
                      disabled={u.role === 'admin'}
                    >
                      <option value="">Moderate…</option>
                      <option value="active">Activate</option>
                      <option value="deactivated">Deactivate</option>
                      <option value="deleted">Delete / ban</option>
                    </select>
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
