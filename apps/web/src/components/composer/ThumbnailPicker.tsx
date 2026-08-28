"use client";

import { Check, Pin } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ThumbnailPickerProps {
  thumbnails: Array<{
    id: string;
    url: string;
    name: string;
    width: number;
    height: number;
  }>;
  currentCoverId?: string;
  onSelect: (id: string) => void;
  previewUrl?: string;
}

export function ThumbnailPicker({ thumbnails, currentCoverId, onSelect, previewUrl }: ThumbnailPickerProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (thumbnails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] py-8">
        <p className="text-[var(--text-muted)] text-sm">Belum ada thumbnail</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Preview */}
      {previewUrl && (
        <div className="rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            <img
              src={previewUrl}
              alt="Preview"
              className="h-full w-full object-cover"
            />
            <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5">
              <Pin className="h-3 w-3 text-[var(--accent-gold)]" />
              <span className="text-white text-xs">Cover Preview</span>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div>
        <p className="mb-2 font-medium text-xs text-[var(--text-muted)]">
          Pilih thumbnail utama ({thumbnails.length} gambar)
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {thumbnails.map((thumb) => {
            const isCover = thumb.id === currentCoverId;
            return (
              <button
                key={thumb.id}
                onClick={() => onSelect(thumb.id)}
                onMouseEnter={() => setHoveredId(thumb.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={cn(
                  "group relative aspect-square overflow-hidden rounded-lg border-2 transition-all",
                  isCover
                    ? "border-[var(--accent-gold)] ring-2 ring-[var(--accent-gold)]/30"
                    : "border-[var(--border)] hover:border-[var(--accent-gold)]/60",
                )}
              >
                <img
                  src={thumb.url}
                  alt={thumb.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />

                {/* Cover indicator */}
                {isCover && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="flex items-center gap-1 rounded-full bg-[var(--accent-gold)] px-2 py-0.5">
                      <Check className="h-3 w-3 text-white" />
                      <span className="text-white text-xs font-medium">Cover</span>
                    </div>
                  </div>
                )}

                {/* Hover overlay */}
                {hoveredId === thumb.id && !isCover && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Pin className="h-5 w-5 text-white" />
                  </div>
                )}

                {/* Name */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                  <p className="truncate text-white text-[10px]">{thumb.name}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
        <p className="font-medium text-xs">Tips Thumbnail</p>
        <ul className="mt-1 space-y-1 text-[var(--text-muted)] text-xs">
          <li>• Thumbnail muncul di feed dan halaman profil</li>
          <li>• Rasio optimal: 4:5 untuk Instagram, 16:9 untuk YouTube</li>
          <li>• Gunakan gambar dengan komposisi yang menarik</li>
        </ul>
      </div>
    </div>
  );
}
