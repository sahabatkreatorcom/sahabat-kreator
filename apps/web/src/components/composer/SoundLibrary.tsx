"use client";

import {
  Check,
  Heart,
  Loader2,
  Music,
  Play,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Sound {
  id: string;
  title: string;
  artist: string;
  duration: number; // seconds
  url: string;
  coverUrl?: string;
  isMySound: boolean;
  tags: string[];
}

interface SoundLibraryProps {
  onAdd: (sound: Sound) => void;
  currentSound?: Sound | null;
}

// Mock sounds data — replace with real API in production
const MOCK_SOUNDS: Sound[] = [
  {
    id: "1",
    title: "Sunset Vibes",
    artist: "Lo-Fi Collective",
    duration: 30,
    url: "#",
    isMySound: false,
    tags: ["chill", "lofi", "sunset"],
  },
  {
    id: "2",
    title: "Motivation Beat",
    artist: "Epic Sounds",
    duration: 15,
    url: "#",
    isMySound: false,
    tags: ["upbeat", "motivational"],
  },
  {
    id: "3",
    title: "Chill Hop",
    artist: "Beat Maker ID",
    duration: 20,
    url: "#",
    isMySound: true,
    tags: ["hiphop", "chill"],
  },
  {
    id: "4",
    title: "Acoustic Morning",
    artist: "Indie Indonesia",
    duration: 25,
    url: "#",
    isMySound: false,
    tags: ["acoustic", "morning"],
  },
  {
    id: "5",
    title: "Electronic Pulse",
    artist: "Synthwave ID",
    duration: 15,
    url: "#",
    isMySound: true,
    tags: ["electronic", "synth"],
  },
  {
    id: "6",
    title: "Traditional Gamelan",
    artist: "Budaya Nusantara",
    duration: 30,
    url: "#",
    isMySound: false,
    tags: ["traditional", "indonesian"],
  },
];

export function SoundLibrary({ onAdd, currentSound }: SoundLibraryProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "mine">("all");
  const [searching, setSearching] = useState(false);
  const [sounds, setSounds] = useState<Sound[]>(MOCK_SOUNDS);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [mySounds, setMySounds] = useState<Sound[]>(MOCK_SOUNDS.filter((s) => s.isMySound));

  useEffect(() => {
    const stored = localStorage.getItem("sk-my-sounds");
    if (stored) {
      setMySounds(JSON.parse(stored));
    }
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) {
      setSounds(filter === "mine" ? mySounds : MOCK_SOUNDS);
      return;
    }
    setSearching(true);
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 500));
    const filtered = MOCK_SOUNDS.filter(
      (s) =>
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.artist.toLowerCase().includes(query.toLowerCase()) ||
        s.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())),
    );
    setSounds(filtered);
    setSearching(false);
  };

  const handleAdd = (sound: Sound) => {
    onAdd(sound);
    toast.success(`Sound "${sound.title}" ditambahkan`);
  };

  const handlePlay = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
      setTimeout(() => setPlayingId(null), 3000);
    }
  };

  const filteredSounds = filter === "mine" ? mySounds : sounds;

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Cari sound..."
            className="h-9 pl-9 text-sm"
          />
        </div>
        <Button variant="secondary" size="sm" onClick={handleSearch} disabled={searching} className="shrink-0">
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cari"}
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-0.5">
          {(["all", "mine"] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                if (f === "mine") setSounds(mySounds);
                else setSounds(MOCK_SOUNDS);
              }}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                filter === f
                  ? "bg-[var(--accent-gold)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]",
              )}
            >
              {f === "all" ? "Semua" : `Saya (${mySounds.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="max-h-80 overflow-y-auto space-y-1.5">
        {filteredSounds.length === 0 ? (
          <div className="py-8 text-center">
            <Music className="mx-auto mb-2 h-8 w-8 text-[var(--text-muted)]" />
            <p className="text-[var(--text-muted)] text-sm">
              {query ? "Tidak ada sound ditemukan" : "Belum ada sound saya"}
            </p>
          </div>
        ) : (
          filteredSounds.map((sound) => {
            const isSelected = currentSound?.id === sound.id;
            const isPlaying = playingId === sound.id;
            return (
              <div
                key={sound.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-2.5 transition-colors",
                  isSelected
                    ? "border-[var(--accent-gold)] bg-[var(--accent-gold-light)]"
                    : "border-[var(--border)] hover:border-[var(--accent-gold)]/50",
                )}
              >
                {/* Play button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 shrink-0 p-0 rounded-full",
                    isPlaying && "bg-[var(--accent-gold)] text-white",
                  )}
                  onClick={() => handlePlay(sound.id)}
                >
                  {isPlaying ? (
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-3 w-0.5 animate-pulse bg-current"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>

                {/* Sound info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-medium text-sm">{sound.title}</p>
                    {sound.isMySound && (
                      <span className="shrink-0 rounded-full bg-[var(--accent-gold)]/20 px-1.5 py-0.5 text-[10px] text-[var(--accent-gold)]">
                        Saya
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[var(--text-muted)] text-xs">{sound.artist}</p>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {sound.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Duration & Actions */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="text-[var(--text-muted)] text-xs">{formatDuration(sound.duration)}</span>
                  <Button
                    size="sm"
                    variant={isSelected ? "primary" : "secondary"}
                    className={cn("h-7 w-7 p-0", isSelected && "bg-[var(--accent-gold)]")}
                    onClick={() => handleAdd(sound)}
                  >
                    {isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* My Sounds section (when in all view and has my sounds) */}
      {filter === "all" && mySounds.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center justify-between">
            <p className="font-medium text-xs text-[var(--text-muted)]">Sound Saya</p>
            <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => setFilter("mine")}>
              Lihat Semua <Heart className="h-3 w-3" />
            </Button>
          </div>
          <div className="mt-1.5 space-y-1.5">
            {mySounds.slice(0, 2).map((sound) => (
              <div
                key={sound.id}
                className="flex items-center gap-2 rounded-lg border border-[var(--border)] p-2"
              >
                <button
                  onClick={() => handlePlay(sound.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--accent-gold)] hover:text-white transition-colors"
                >
                  {playingId === sound.id ? (
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-2 w-0.5 animate-pulse bg-current"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{sound.title}</p>
                  <p className="truncate text-[var(--text-muted)] text-xs">{sound.artist}</p>
                </div>
                <span className="text-[var(--text-muted)] text-xs">{formatDuration(sound.duration)}</span>
                <Button
                  size="sm"
                  variant={currentSound?.id === sound.id ? "primary" : "ghost"}
                  className="h-7 w-7 p-0"
                  onClick={() => handleAdd(sound)}
                >
                  {currentSound?.id === sound.id ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
