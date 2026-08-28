'use client';

import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PlatformTestResult {
  platform: string;
  status: 'testing' | 'success' | 'error';
  message: string;
  details?: {
    accessTokenValid: boolean;
    accountName?: string;
    followers?: number;
    lastPostDate?: string;
  };
}

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', color: '#1877F2' },
  { id: 'instagram', name: 'Instagram', color: '#E4405F' },
];

export function MetaAPITests() {
  const [results, setResults] = useState<PlatformTestResult[]>([]);
  const [testingAll, setTestingAll] = useState(false);

  const testPlatform = async (platform: string) => {
    setResults((prev) =>
      prev.map((r) => r.platform === platform ? { ...r, status: 'testing' } : r),
    );

    try {
      const res = await fetch(`/api/admin/meta/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResults((prev) =>
          prev.map((r) =>
            r.platform === platform
              ? {
                  platform,
                  status: 'error',
                  message: data.error || 'Test gagal',
                }
              : r,
          ),
        );
        toast.error(`Meta API test gagal: ${data.error}`);
      } else {
        setResults((prev) =>
          prev.map((r) =>
            r.platform === platform
              ? {
                  platform,
                  status: 'success',
                  message: 'API terhubung dengan baik',
                  details: data.details,
                }
              : r,
          ),
        );
        toast.success(`Meta API ${platform} terhubung`);
      }
    } catch {
      setResults((prev) =>
        prev.map((r) =>
          r.platform === platform
            ? { platform, status: 'error', message: 'Network error' }
            : r,
        ),
      );
    }
  };

  const testAll = async () => {
    setTestingAll(true);
    setResults(PLATFORMS.map((p) => ({ platform: p.id, status: 'testing', message: '' })));

    for (const platform of PLATFORMS) {
      await testPlatform(platform.id);
    }

    setTestingAll(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">Meta API Test</h2>
          <p className="text-[var(--text-muted)] text-sm">
            Verifikasi koneksi API Facebook & Instagram
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={testAll} disabled={testingAll} className="gap-2">
          {testingAll ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Test Semua
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PLATFORMS.map((platform) => {
          const result = results.find((r) => r.platform === platform.id);

          return (
            <div key={platform.id} className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${platform.color}15` }}
                  >
                    <span className="font-bold text-sm" style={{ color: platform.color }}>
                      {platform.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{platform.name}</h3>
                    <p className="text-[var(--text-muted)] text-xs">
                      {result?.status === 'success' ? 'Terhubung' :
                       result?.status === 'error' ? 'Error' :
                       result?.status === 'testing' ? 'Sedang diuji...' :
                       'Belum diuji'}
                    </p>
                  </div>
                </div>
                {result ? (
                  result.status === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-[var(--success)]" />
                  ) : result.status === 'error' ? (
                    <XCircle className="h-5 w-5 text-[var(--error)]" />
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--accent-gold)]" />
                  )
                ) : (
                  <AlertTriangle className="h-5 w-5 text-[var(--text-muted)]" />
                )}
              </div>

              {result?.message && (
                <p className={cn(
                  'mb-4 text-sm',
                  result.status === 'success' ? 'text-[var(--success)]' : 'text-[var(--error)]',
                )}>
                  {result.message}
                </p>
              )}

              {result?.details && result.status === 'success' && (
                <div className="mb-4 space-y-2 rounded-lg bg-[var(--bg-tertiary)] p-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Access Token</span>
                    <span className={cn(result.details.accessTokenValid ? 'text-[var(--success)]' : 'text-[var(--error)]')}>
                      {result.details.accessTokenValid ? 'Valid' : 'Invalid'}
                    </span>
                  </div>
                  {result.details.accountName && (
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Akun</span>
                      <span className="font-medium">{result.details.accountName}</span>
                    </div>
                  )}
                  {result.details.followers && (
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Followers</span>
                      <span className="font-medium">{result.details.followers.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>
              )}

              <Button
                variant="secondary"
                size="sm"
                className="w-full gap-2"
                onClick={() => testPlatform(platform.id)}
                disabled={result?.status === 'testing'}
              >
                {result?.status === 'testing' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menguji...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Test Sekarang
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-[var(--warning)]/20 bg-[var(--warning)]/5 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--warning)]" />
          <div>
            <p className="font-medium text-sm text-[var(--warning)]">
              Informasi Penting
            </p>
            <p className="mt-1 text-[var(--text-muted)] text-xs">
              Test ini hanya memverifikasi koneksi API dengan token yang tersedia.
              Pastikan credential platform sudah dikonfigurasi di tab "Platform API"
              sebelum melakukan test.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
