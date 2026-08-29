"use client";

import {
  ArrowDown,
  ArrowUp,
  Image as ImageIcon,
  MoveHorizontal,
  Pin,
  Video,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CarouselItem {
  id: string;
  url: string;
  mimeType: string;
  name: string;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  isCover: boolean;
  focalPoint?: { x: number; y: number };
}

interface MediaCarouselProps {
  items: CarouselItem[];
  onChange: (items: CarouselItem[]) => void;
  onRemove?: (id: string) => void;
}

export function MediaCarousel({ items, onChange, onRemove }: MediaCarouselProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const updated = [...items];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    onChange(updated);
  };

  const setCover = (index: number) => {
    const updated = items.map((item, i) => ({
      ...item,
      isCover: i === index,
    }));
    onChange(updated);
    toast.success("Thumbnail utama diubah");
  };

  const handleSetFocalPoint = (index: number, x: number, y: number) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, focalPoint: { x, y } } : item,
    );
    onChange(updated);
  };

  const handleRemove = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    onChange(updated);
    onRemove?.(id);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-[var(--border)] border-dashed py-12">
        <ImageIcon className="mb-3 h-10 w-10 text-[var(--text-muted)]" />
        <p className="font-medium text-[var(--text-muted)]">Belum ada media</p>
        <p className="text-[var(--text-muted)] text-sm">Upload gambar atau video untuk carousel</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[var(--text-muted)] text-xs">{items.length} media</p>
        <span className="text-[var(--text-muted)] text-xs">
          Cover:{" "}
          <span className="font-medium text-[var(--accent-gold)]">
            {items.find((i) => i.isCover)?.name || items[0]?.name}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "group relative cursor-move overflow-hidden rounded-lg border transition-all",
              item.isCover
                ? "border-[var(--accent-gold)] ring-2 ring-[var(--accent-gold)]/30"
                : "border-[var(--border)]",
              draggedIndex === index && "opacity-50",
            )}
            draggable
            onDragStart={() => setDraggedIndex(index)}
            onDragOver={(e) => {
              e.preventDefault();
              const targetIndex = index;
              if (draggedIndex !== null && draggedIndex !== targetIndex) {
                handleReorder(draggedIndex, targetIndex);
                setDraggedIndex(targetIndex);
              }
            }}
            onDrop={() => setDraggedIndex(null)}
            onDragEnd={() => setDraggedIndex(null)}
          >
            {/* Thumbnail */}
            <div className="relative aspect-square overflow-hidden bg-[var(--bg-secondary)]">
              {item.mimeType.startsWith("image/") ? (
                <img
                  src={item.url}
                  alt={item.name}
                  className={cn(
                    "h-full w-full object-cover transition-transform",
                    item.focalPoint &&
                      `object-${item.focalPoint.x * 100}%-${item.focalPoint.y * 100}%`,
                  )}
                  style={
                    item.focalPoint
                      ? {
                          objectPosition: `${item.focalPoint.x * 100}% ${item.focalPoint.y * 100}%`,
                        }
                      : undefined
                  }
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Video className="h-8 w-8 text-[var(--text-muted)]" />
                </div>
              )}

              {/* Cover badge */}
              {item.isCover && (
                <div className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full bg-[var(--accent-gold)] px-1.5 py-0.5">
                  <Pin className="h-3 w-3 text-white" />
                  <span className="font-medium text-[10px] text-white">Cover</span>
                </div>
              )}

              {/* Position counter */}
              <div className="absolute top-1.5 right-1.5 rounded-full bg-black/60 px-1.5 py-0.5 font-medium text-[10px] text-white">
                {index + 1}
              </div>

              {/* Hover actions */}
              <div className="absolute inset-0 hidden items-center justify-center gap-1 bg-black/60 transition-opacity group-hover:flex">
                {!item.isCover && (
                  <Button
                    size="sm"
                    className="h-7 w-7 bg-white/90 p-0 text-black hover:bg-white"
                    onClick={() => setCover(index)}
                    title="Set sebagai thumbnail"
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  className="h-7 w-7 p-0"
                  onClick={() => handleRemove(item.id)}
                  title="Hapus"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Reorder handles */}
            <div className="flex border-[var(--border)] border-t bg-[var(--bg-secondary)]">
              <button
                onClick={() => handleReorder(index, index - 1)}
                disabled={index === 0}
                className="flex flex-1 items-center justify-center gap-1 border-[var(--border)] border-r py-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30"
                title="Naikkan"
              >
                <ArrowUp className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleReorder(index, index + 1)}
                disabled={index === items.length - 1}
                className="flex flex-1 items-center justify-center py-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30"
                title="Turunkan"
              >
                <ArrowDown className="h-3 w-3" />
              </button>
            </div>

            {/* Focal point setter */}
            {item.mimeType.startsWith("image/") && (
              <button
                className="flex w-full items-center justify-center gap-1 border-[var(--border)] border-t py-1 text-[var(--text-muted)] text-xs transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                onClick={() => {
                  const current = item.focalPoint || { x: 0.5, y: 0.5 };
                  handleSetFocalPoint(
                    index,
                    current.x === 0.5 && current.y === 0.5 ? 0.3 : 0.5,
                    current.y === 0.5 ? 0.3 : 0.5,
                  );
                  toast.success("Titik fokus diubah");
                }}
                title="Ubah titik fokus"
              >
                <MoveHorizontal className="h-3 w-3" />
                {item.focalPoint ? "Ubah Fokus" : "Atur Fokus"}
              </button>
            )}

            {/* File name */}
            <p
              className="truncate border-[var(--border)] border-t px-2 py-1 text-[var(--text-muted)] text-xs"
              title={item.name}
            >
              {item.name}
            </p>
          </div>
        ))}
      </div>

      {/* Insert placeholder for new media */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="h-px w-full bg-[var(--border)]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[var(--bg-primary)] px-3 text-[var(--text-muted)] text-xs">
            Atau drag & drop lebih banyak media
          </span>
        </div>
      </div>
    </div>
  );
}
