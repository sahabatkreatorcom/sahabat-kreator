"use client";

import { Loader2, Palette, Save, Sun, Moon, Monitor } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Terang", icon: <Sun className="h-5 w-5" /> },
  { value: "dark", label: "Gelap", icon: <Moon className="h-5 w-5" /> },
  { value: "system", label: "Sistem", icon: <Monitor className="h-5 w-5" /> },
];

const ACCENT_COLORS = [
  { name: "Gold", value: "#D4A843", light: "#FDF6E3" },
  { name: "Blue", value: "#3B82F6", light: "#EFF6FF" },
  { name: "Green", value: "#10B981", light: "#ECFDF5" },
  { name: "Purple", value: "#8B5CF6", light: "#F5F3FF" },
  { name: "Pink", value: "#EC4899", light: "#FDF2F8" },
  { name: "Red", value: "#EF4444", light: "#FEF2F2" },
];

export function AppearanceSettings() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [accentColor, setAccentColor] = useState("#D4A843");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("sk-theme") as Theme | null;
    const savedAccent = localStorage.getItem("sk-accent-color");
    if (savedTheme) setTheme(savedTheme);
    if (savedAccent) setAccentColor(savedAccent);
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("sk-theme", newTheme);

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  };

  const handleAccentChange = (color: string) => {
    setAccentColor(color);
    localStorage.setItem("sk-accent-color", color);
    document.documentElement.style.setProperty("--accent-gold", color);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/appearance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, accentColor }),
      });
      if (res.ok) {
        toast.success("Pengaturan tampilan disimpan");
      } else {
        toast.error("Gagal menyimpan pengaturan");
      }
    } catch {
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Tampilan
        </CardTitle>
        <CardDescription>Kustomisasi tampilan aplikasi</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Selection */}
        <div className="space-y-3">
          <Label>Tema</Label>
          <div className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleThemeChange(option.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                  theme === option.value
                    ? "border-[var(--accent-gold)] bg-[var(--accent-gold-light)]"
                    : "border-[var(--border)] hover:border-[var(--accent-gold)]",
                )}
              >
                {option.icon}
                <span className="text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div className="space-y-3">
          <Label>Warna Aksen</Label>
          <div className="flex flex-wrap gap-3">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => handleAccentChange(color.value)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-all",
                  accentColor === color.value
                    ? "ring-2 ring-offset-2 ring-offset-[var(--bg-primary)]"
                    : "hover:scale-110",
                )}
                style={{
                  backgroundColor: color.value,
                }}
                title={color.name}
              >
                {accentColor === color.value && <span className="text-white text-xs">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <Label>Preview</Label>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm"
                style={{ backgroundColor: accentColor, color: "white" }}
              >
                SK
              </div>
              <div>
                <p className="font-medium text-sm">Sahabat Kreator</p>
                <p className="text-[var(--text-muted)] text-xs">Preview tampilan Anda</p>
              </div>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan Pengaturan
        </Button>
      </CardContent>
    </Card>
  );
}
