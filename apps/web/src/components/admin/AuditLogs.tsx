'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Download, RefreshCw, CalendarDays, User, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  CREATE_POST: 'Buat Post',
  UPDATE_POST: 'Update Post',
  DELETE_POST: 'Hapus Post',
  PUBLISH_POST: 'Publikasi',
  CONNECT_ACCOUNT: 'Hubungkan Akun',
  DISCONNECT_ACCOUNT: 'Putuskan Akun',
  INVITE_MEMBER: 'Undang Member',
  REMOVE_MEMBER: 'Hapus Member',
  UPDATE_ROLE: 'Ubah Role',
  CHANGE_SETTINGS: 'Ubah Pengaturan',
  CREATE_INVITATION: 'Buat Undangan',
  ACCEPT_INVITATION: 'Terima Undangan',
};

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'text-green-600',
  LOGOUT: 'text-blue-600',
  CREATE_POST: 'text-purple-600',
  UPDATE_POST: 'text-yellow-600',
  DELETE_POST: 'text-red-600',
  PUBLISH_POST: 'text-green-600',
  CONNECT_ACCOUNT: 'text-blue-600',
  DISCONNECT_ACCOUNT: 'text-red-600',
  INVITE_MEMBER: 'text-purple-600',
  REMOVE_MEMBER: 'text-red-600',
  UPDATE_ROLE: 'text-orange-600',
  CHANGE_SETTINGS: 'text-gray-600',
  CREATE_INVITATION: 'text-purple-600',
  ACCEPT_INVITATION: 'text-green-600',
};

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set('action', actionFilter);
      if (dateFrom) params.set('startDate', dateFrom);
      if (dateTo) params.set('endDate', dateTo);
      params.set('limit', String(LIMIT));
      params.set('offset', String((page - 1) * LIMIT));

      const res = await fetch(`/api/admin/audit/logs?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
    } catch {
      toast.error('Gagal memuat audit log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, dateFrom, dateTo]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set('action', actionFilter);
      if (dateFrom) params.set('startDate', dateFrom);
      if (dateTo) params.set('endDate', dateTo);

      const res = await fetch(`/api/admin/audit/logs/export?${params}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Audit log berhasil diekspor');
    } catch {
      toast.error('Gagal mengekspor audit log');
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchSearch = !search || log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(search.toLowerCase());
    const matchAction = !actionFilter || log.action === actionFilter;
    return matchSearch && matchAction;
  });

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-lg">Audit Log</h2>
          <p className="text-[var(--text-muted)] text-sm">
            Riwayat aktivitas pengguna di seluruh organisasi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="gap-2" onClick={fetchLogs}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button variant="secondary" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              placeholder="Cari user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] pl-9 pr-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-gold)]"
            >
              <option value="">Semua Aksi</option>
              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-10"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="spinner-gradient" />
              <p className="text-[var(--text-muted)] text-sm">Memuat audit log...</p>
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)]">
            <Activity className="mb-3 h-8 w-8 opacity-50" />
            <p className="font-medium">Belum ada log</p>
            <p className="text-sm">Aktivitas akan muncul di sini</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-tertiary)] text-left">
                    <th className="px-4 py-3 font-medium text-[var(--text-muted)]">Waktu</th>
                    <th className="px-4 py-3 font-medium text-[var(--text-muted)]">User</th>
                    <th className="px-4 py-3 font-medium text-[var(--text-muted)]">Aksi</th>
                    <th className="px-4 py-3 font-medium text-[var(--text-muted)]">Entity</th>
                    <th className="px-4 py-3 font-medium text-[var(--text-muted)]">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-[var(--border-light)] last:border-0 hover:bg-[var(--bg-tertiary)]/50">
                      <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-bold text-xs">
                            {log.userName?.charAt(0) || log.userEmail?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium">{log.userName || 'Unknown'}</p>
                            <p className="text-[var(--text-muted)] text-xs">{log.userEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('font-medium', ACTION_COLORS[log.action] || 'text-[var(--text-primary)]')}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">
                        {log.entityType && (
                          <span className="rounded bg-[var(--bg-tertiary)] px-2 py-0.5 text-xs">
                            {log.entityType}
                          </span>
                        )}
                        {log.entityId && (
                          <span className="ml-1 text-[var(--text-muted)] text-xs font-mono">
                            {log.entityId.slice(0, 8)}...
                          </span>
                        )}
                        {!log.entityType && '-'}
                      </td>
                      <td className="px-4 py-3 font-mono text-[var(--text-muted)] text-xs">
                        {log.ipAddress || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3">
              <p className="text-[var(--text-muted)] text-sm">
                Menampilkan {((page - 1) * LIMIT) + 1}-{Math.min(page * LIMIT, total)} dari {total} log
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Sebelumnya
                </Button>
                <span className="px-3 py-1 text-sm text-[var(--text-muted)]">
                  {page} / {totalPages || 1}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
