'use client';

import { useState } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Brain,
  TrendingUp,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface BrandTrait {
  name: string;
  score: number;
  description: string;
}

interface BrandProfile {
  voice: string;
  tone: string;
  traits: BrandTrait[];
  sampleCount: number;
  lastUpdated: string;
}

const DEFAULT_PROFILE: BrandProfile = {
  voice: 'profesional',
  tone: 'ramah',
  traits: [
    { name: 'Professional', score: 75, description: 'Gaya bahasa formal namun mudah dipahami' },
    { name: 'Friendly', score: 68, description: 'Sentuhan personal yang hangat' },
    { name: 'Informative', score: 82, description: 'Berisi edukasi dan tips bermanfaat' },
    { name: 'Persuasive', score: 45, description: 'Mengajak tanpa memaksa' },
    { name: 'Humorous', score: 30, description: 'Sedikit sentuhan humor' },
  ],
  sampleCount: 0,
  lastUpdated: '-',
};

const VOICE_OPTIONS = ['profesional', 'kasual', 'formal', 'lucu', 'inspiratif', 'edukatif'];
const TONE_OPTIONS = ['ramah', 'serius', 'motivational', 'humoris', 'santai', 'berwibawa'];

export function BrandVoiceProfile() {
  const [profile, setProfile] = useState<BrandProfile>(DEFAULT_PROFILE);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [previewText, setPreviewText] = useState('');
  const [previewScore, setPreviewScore] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editVoice, setEditVoice] = useState(profile.voice);
  const [editTone, setEditTone] = useState(profile.tone);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/brand/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      toast.success('Brand guidelines berhasil diupload');
    } catch {
      toast.error('Gagal mengupload file');
    } finally {
      setUploading(false);
    }
  };

  const analyzeBrandVoice = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/brand/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice: editVoice, tone: editTone }),
      });

      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setProfile(data.profile);
      setAnalyzing(false);
      setIsEditing(false);
      toast.success('Profil brand voice diperbarui');
    } catch {
      toast.error('Gagal menganalisis brand voice');
      setAnalyzing(false);
    }
  };

  const scoreContent = async () => {
    if (!previewText.trim()) {
      toast.error('Masukkan teks terlebih dahulu');
      return;
    }
    try {
      const res = await fetch('/api/brand/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: previewText }),
      });
      if (!res.ok) throw new Error('Score failed');
      const data = await res.json();
      setPreviewScore(data.score);
      toast.success('Konten dianalisis');
    } catch {
      toast.error('Gagal menganalisis konten');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-lg">Brand Voice Profile</h2>
        <p className="text-[var(--text-muted)] text-sm">
          Latih AI untuk memahami gaya komunikasi brand Anda
        </p>
      </div>

      {/* Voice Settings */}
      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-[var(--accent-gold)]" />
            <h3 className="font-semibold">Pengaturan Voice & Tone</h3>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setIsEditing(!isEditing)}>
            <Edit3 className="h-3.5 w-3.5" />
            {isEditing ? 'Tutup' : 'Edit'}
          </Button>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Brand Voice</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {VOICE_OPTIONS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setEditVoice(v)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-sm transition-all capitalize',
                      editVoice === v
                        ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]'
                        : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]',
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Brand Tone</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {TONE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setEditTone(t)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-sm transition-all capitalize',
                      editTone === t
                        ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]'
                        : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]',
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={analyzeBrandVoice} disabled={analyzing} className="gap-2">
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menganalisis...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analisis Brand Voice
                </>
              )}
            </Button>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex gap-4">
              <div className="rounded-lg bg-[var(--accent-gold)]/10 px-3 py-2">
                <span className="text-[var(--text-muted)] text-xs">Voice</span>
                <p className="font-semibold capitalize">{profile.voice}</p>
              </div>
              <div className="rounded-lg bg-purple-500/10 px-3 py-2">
                <span className="text-[var(--text-muted)] text-xs">Tone</span>
                <p className="font-semibold capitalize">{profile.tone}</p>
              </div>
            </div>

            <div className="space-y-3">
              {profile.traits.map((trait) => (
                <div key={trait.name}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium text-sm">{trait.name}</span>
                    <span className="text-[var(--text-muted)] text-xs">{trait.score}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-tertiary)]">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-gold-light)] transition-all"
                      style={{ width: `${trait.score}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[var(--text-muted)] text-xs">{trait.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Guidelines */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-[var(--accent-gold)]" />
          <h3 className="font-semibold">Upload Brand Guidelines</h3>
        </div>
        <div className="border-2 border-dashed border-[var(--border)] rounded-xl p-8 text-center">
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
            id="brand-upload"
          />
          <label
            htmlFor="brand-upload"
            className={cn(
              'cursor-pointer inline-flex flex-col items-center gap-3',
              uploading && 'pointer-events-none opacity-50',
            )}
          >
            <Upload className="h-10 w-10 text-[var(--text-muted)]" />
            <div>
              <p className="font-medium">Upload dokumen brand guidelines</p>
              <p className="text-[var(--text-muted)] text-sm">PDF, DOC, atau TXT (max 10MB)</p>
            </div>
          </label>
          {uploading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-[var(--accent-gold)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Mengupload...
            </div>
          )}
        </div>
      </div>

      {/* Content Scorer */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-[var(--accent-gold)]" />
          <h3 className="font-semibold">Skor Kecocokan Konten</h3>
        </div>
        <p className="mb-4 text-[var(--text-muted)] text-sm">
          Analisis apakah konten Anda sesuai dengan brand voice yang telah ditetapkan
        </p>

        <textarea
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          placeholder="Tempel caption atau konten di sini untuk dianalisis..."
          rows={4}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm resize-none mb-3"
        />

        <div className="flex items-center gap-3">
          <Button onClick={scoreContent} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Analisis Konten
          </Button>

          {previewScore !== null && (
            <div className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2',
              previewScore >= 70 ? 'bg-[var(--success)]/10' :
              previewScore >= 40 ? 'bg-[var(--warning)]/10' :
              'bg-[var(--error)]/10',
            )}>
              {previewScore >= 70 ? (
                <CheckCircle className="h-5 w-5 text-[var(--success)]" />
              ) : previewScore >= 40 ? (
                <span className="h-5 w-5 flex items-center justify-center text-[var(--warning)] font-bold">~</span>
              ) : (
                <XCircle className="h-5 w-5 text-[var(--error)]" />
              )}
              <span className={cn(
                'font-bold',
                previewScore >= 70 ? 'text-[var(--success)]' :
                previewScore >= 40 ? 'text-[var(--warning)]' :
                'text-[var(--error)]',
              )}>
                {previewScore}% cocok
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
