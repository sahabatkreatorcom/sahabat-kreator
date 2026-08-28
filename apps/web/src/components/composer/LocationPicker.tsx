"use client";

import {
  MapPin,
  Navigation,
  Search,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Location {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  isPopular: boolean;
}

interface LocationPickerProps {
  onSelect: (location: Location | null) => void;
  currentLocation?: Location | null;
}

// Popular Indonesian locations
const POPULAR_LOCATIONS: Location[] = [
  { id: "1", name: "Monas", address: "Jakarta Pusat, DKI Jakarta", lat: -6.1754, lng: 106.8272, category: "Landmark", isPopular: true },
  { id: "2", name: "Kawasan menteng", address: "Menteng, Jakarta Pusat", lat: -6.1944, lng: 106.8384, category: "Area", isPopular: true },
  { id: "3", name: "Kota Tua Jakarta", address: "Jakarta Barat, DKI Jakarta", lat: -6.1352, lng: 106.8133, category: "Landmark", isPopular: true },
  { id: "4", name: "Bundaran HI", address: "Gambir, Jakarta Pusat", lat: -6.1950, lng: 106.8230, category: "Landmark", isPopular: true },
  { id: "5", name: "Trans Studio Bandung", address: "Bandung, Jawa Barat", lat: -6.8845, lng: 107.6328, category: "Entertainment", isPopular: true },
  { id: "6", name: "Kawaha Bandung", address: "Bandung, Jawa Barat", lat: -6.9175, lng: 107.6194, category: "Area", isPopular: true },
  { id: "7", name: "Kawasan Surabayan", address: "Surabaya, Jawa Timur", lat: -7.2575, lng: 112.7521, category: "Area", isPopular: true },
  { id: "8", name: "Beach Walk Denpasar", address: "Denpasar, Bali", lat: -8.6705, lng: 115.2126, category: "Entertainment", isPopular: true },
];

export function LocationPicker({ onSelect, currentLocation }: LocationPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [showRecent, setShowRecent] = useState(false);
  const [recentLocations, setRecentLocations] = useState<Location[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("sk-recent-locations");
    if (stored) {
      setRecentLocations(JSON.parse(stored));
    }
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults(POPULAR_LOCATIONS);
      return;
    }
    // Simulate search
    await new Promise((r) => setTimeout(r, 300));
    const filtered = POPULAR_LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(query.toLowerCase()) ||
        loc.address.toLowerCase().includes(query.toLowerCase()) ||
        loc.category.toLowerCase().includes(query.toLowerCase()),
    );
    setResults(filtered);
  };

  const handleSelect = (location: Location) => {
    onSelect(location);
    const updated = [location, ...recentLocations.filter((l) => l.id !== location.id)].slice(0, 5);
    setRecentLocations(updated);
    localStorage.setItem("sk-recent-locations", JSON.stringify(updated));
    toast.success(`Lokasi "${location.name}" dipilih`);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Browser tidak mendukung geolokasi");
      return;
    }
    toast.info("Mengambil lokasi...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: Location = {
          id: "current",
          name: "Lokasi Saat Ini",
          address: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          category: "GPS",
          isPopular: false,
        };
        setUserLocation(loc);
        handleSelect(loc);
      },
      () => {
        toast.error("Gagal mendapatkan lokasi");
      },
    );
  };

  const categories = [...new Set(POPULAR_LOCATIONS.map((l) => l.category))];

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Cari tempat..."
            className="h-9 pl-9 text-sm"
          />
        </div>
        <Button variant="secondary" size="sm" onClick={handleSearch} className="shrink-0">
          Cari
        </Button>
      </div>

      {/* Get current location */}
      <Button
        variant="secondary"
        size="sm"
        className="w-full gap-2 text-xs"
        onClick={handleGetCurrentLocation}
      >
        <Navigation className="h-4 w-4" />
        Gunakan Lokasi Sekarang
      </Button>

      {/* Recent locations */}
      {recentLocations.length > 0 && (
        <div>
          <button
            onClick={() => setShowRecent(!showRecent)}
            className="mb-1.5 flex items-center gap-1.5 font-medium text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <MapPin className="h-3.5 w-3.5" />
            Lokasi Terakhir
            <span className="rounded-full bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[10px]">
              {recentLocations.length}
            </span>
          </button>
          {showRecent && (
            <div className="space-y-1.5">
              {recentLocations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => handleSelect(loc)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors hover:border-[var(--accent-gold)]/50",
                    currentLocation?.id === loc.id && "border-[var(--accent-gold)] bg-[var(--accent-gold-light)]",
                  )}
                >
                  <MapPin className={cn("h-4 w-4 shrink-0", currentLocation?.id === loc.id ? "text-[var(--accent-gold)]" : "text-[var(--text-muted)]")} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{loc.name}</p>
                    <p className="truncate text-[var(--text-muted)] text-xs">{loc.address}</p>
                  </div>
                  {currentLocation?.id === loc.id && <Check className="h-4 w-4 text-[var(--accent-gold)]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search results / Popular places */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <p className="font-medium text-xs text-[var(--text-muted)]">
            {query ? `Hasil pencarian (${results.length})` : "Tempat Populer"}
          </p>
        </div>

        {/* Category filter */}
        <div className="mb-2 flex flex-wrap gap-1">
          <button
            onClick={() => { setQuery(""); handleSearch(); }}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
              !query ? "bg-[var(--accent-gold)] text-white" : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent-gold-light)]",
            )}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setQuery(cat);
                setTimeout(() => handleSearch(), 0);
              }}
              className="rounded-full bg-[var(--bg-tertiary)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--accent-gold-light)] transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="max-h-60 overflow-y-auto space-y-1.5">
          {results.length === 0 ? (
            <div className="py-6 text-center">
              <MapPin className="mx-auto mb-2 h-8 w-8 text-[var(--text-muted)]" />
              <p className="text-[var(--text-muted)] text-sm">Tidak ada tempat ditemukan</p>
            </div>
          ) : (
            results.map((loc) => (
              <button
                key={loc.id}
                onClick={() => handleSelect(loc)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors hover:border-[var(--accent-gold)]/50",
                  currentLocation?.id === loc.id && "border-[var(--accent-gold)] bg-[var(--accent-gold-light)]",
                )}
              >
                <MapPin className={cn("h-4 w-4 shrink-0", currentLocation?.id === loc.id ? "text-[var(--accent-gold)]" : "text-[var(--text-muted)]")} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-medium text-sm">{loc.name}</p>
                    {loc.isPopular && (
                      <span className="shrink-0 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-600">
                        Populer
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[var(--text-muted)] text-xs">{loc.address}</p>
                  <p className="mt-0.5 text-[var(--text-muted)] text-[10px]">
                    {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                  </p>
                </div>
                {currentLocation?.id === loc.id && (
                  <Check className="h-4 w-4 shrink-0 text-[var(--accent-gold)]" />
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Selected location display */}
      {currentLocation && (
        <div className="rounded-lg border border-[var(--accent-gold)]/30 bg-[var(--accent-gold-light)] p-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[var(--accent-gold)]" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm">{currentLocation.name}</p>
              <p className="text-[var(--text-muted)] text-xs">{currentLocation.address}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => onSelect(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Check(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}
