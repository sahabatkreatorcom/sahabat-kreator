"use client";

import { Check, Download, LayoutGrid, Pencil, Save, Users, X, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PlanFeature {
  key: string;
  label: string;
  description: string;
  type: "boolean" | "number" | "select";
  options?: string[];
  defaultValue: string | boolean | number;
}

interface PlanConfig {
  id: string;
  name: string;
  color: string;
  features: Record<string, string | boolean | number>;
}

const FEATURE_SCHEMA: PlanFeature[] = [
  {
    key: "socialAccounts",
    label: "Akun Media Sosial",
    description: "Jumlah akun media sosial yang bisa dihubungkan",
    type: "number",
    defaultValue: 3,
  },
  {
    key: "teamMembers",
    label: "Anggota Tim",
    description: "Jumlah maksimal anggota tim dalam organisasi",
    type: "number",
    defaultValue: 2,
  },
  {
    key: "scheduledPostsPerMonth",
    label: "Post Terjadwal/bulan",
    description: "Maksimum post yang bisa dijadwalkan setiap bulan",
    type: "number",
    defaultValue: 30,
  },
  {
    key: "aiGenerationsPerMonth",
    label: "AI Generations/bulan",
    description: "Maksimum generate AI caption per bulan",
    type: "number",
    defaultValue: 10,
  },
  {
    key: "analyticsExport",
    label: "Ekspor Analitik",
    description: "Izinkan ekspor data analitik ke CSV/PDF",
    type: "boolean",
    defaultValue: false,
  },
  {
    key: "customBranding",
    label: "Branding Kustom",
    description: "Logo & warna brand di post yang dipublikasikan",
    type: "boolean",
    defaultValue: false,
  },
  {
    key: "prioritySupport",
    label: "Dukungan Prioritas",
    description: "Support channel khusus dengan respon lebih cepat",
    type: "boolean",
    defaultValue: false,
  },
  {
    key: "mediaStorage",
    label: "Penyimpanan Media (GB)",
    description: "Kuota penyimpanan media per organisasi",
    type: "number",
    defaultValue: 5,
  },
];

const DEFAULT_PLANS: PlanConfig[] = [
  {
    id: "free",
    name: "Free",
    color: "#6B7280",
    features: {
      socialAccounts: 3,
      teamMembers: 2,
      scheduledPostsPerMonth: 30,
      aiGenerationsPerMonth: 10,
      analyticsExport: false,
      customBranding: false,
      prioritySupport: false,
      mediaStorage: 1,
    },
  },
  {
    id: "pro",
    name: "Pro",
    color: "#8B5CF6",
    features: {
      socialAccounts: 10,
      teamMembers: 5,
      scheduledPostsPerMonth: 150,
      aiGenerationsPerMonth: 100,
      analyticsExport: true,
      customBranding: false,
      prioritySupport: false,
      mediaStorage: 10,
    },
  },
  {
    id: "business",
    name: "Business",
    color: "#D4A574",
    features: {
      socialAccounts: 25,
      teamMembers: 15,
      scheduledPostsPerMonth: 500,
      aiGenerationsPerMonth: 500,
      analyticsExport: true,
      customBranding: true,
      prioritySupport: false,
      mediaStorage: 50,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    color: "#F59E0B",
    features: {
      socialAccounts: -1,
      teamMembers: -1,
      scheduledPostsPerMonth: -1,
      aiGenerationsPerMonth: -1,
      analyticsExport: true,
      customBranding: true,
      prioritySupport: true,
      mediaStorage: -1,
    },
  },
];

export function PlanConfig() {
  const [plans, setPlans] = useState<PlanConfig[]>(DEFAULT_PLANS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string | boolean | number>>({});

  const startEdit = (plan: PlanConfig) => {
    setEditingId(plan.id);
    setEditForm({ ...plan.features });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (planId: string) => {
    try {
      // Call API to update plan config
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: editForm }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, features: { ...editForm } } : p)),
      );
      toast.success("Plan berhasil diperbarui");
    } catch {
      toast.error("Gagal memperbarui plan");
    } finally {
      setEditingId(null);
    }
  };

  const handleFeatureChange = (key: string, value: string | boolean | number) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-lg">Konfigurasi Plan</h2>
          <p className="text-[var(--text-muted)] text-sm">
            Atur fitur dan limit untuk setiap tier langganan
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={() => toast.success("Konfigurasi tersimpan")}
        >
          <Save className="h-4 w-4" />
          Simpan Semua
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {plans.map((plan) => {
          const isEditing = editingId === plan.id;
          const isUnlimited = (v: number) => v === -1 || v === Number.POSITIVE_INFINITY;

          return (
            <div
              key={plan.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5"
            >
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white"
                    style={{ backgroundColor: `${plan.color}20`, color: plan.color }}
                  >
                    {plan.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{plan.name}</h3>
                    <p className="text-[var(--text-muted)] text-xs">
                      {plan.id === "free"
                        ? "Tier dasar gratis"
                        : plan.id === "pro"
                          ? "Untuk kreator berkembang"
                          : plan.id === "business"
                            ? "Untuk tim & agensi"
                            : "Unlimited everything"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={isEditing ? cancelEdit : () => startEdit(plan)}
                >
                  {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                </Button>
              </div>

              {/* Features */}
              <div className="space-y-3">
                {FEATURE_SCHEMA.map((feat) => {
                  const value = editForm[feat.key] ?? plan.features[feat.key];
                  const isNum = typeof value === "number";
                  const _isBool = typeof value === "boolean";

                  if (isEditing) {
                    return (
                      <div key={feat.key} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{feat.label}</p>
                          <p className="text-[var(--text-muted)] text-xs">{feat.description}</p>
                        </div>
                        {feat.type === "boolean" ? (
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={value as boolean}
                              onChange={(e) => handleFeatureChange(feat.key, e.target.checked)}
                              className="sr-only"
                            />
                            <div
                              className={cn(
                                'peer h-6 w-11 rounded-full transition-all after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[""]',
                                value
                                  ? "bg-[var(--accent-gold)] after:translate-x-full"
                                  : "bg-[var(--bg-tertiary)]",
                              )}
                            />
                          </label>
                        ) : (
                          <Input
                            type="number"
                            value={value as number}
                            onChange={(e) => handleFeatureChange(feat.key, Number(e.target.value))}
                            className="w-24 text-right"
                            min={-1}
                          />
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={feat.key}
                      className="flex items-center justify-between border-[var(--border-light)] border-b py-2 last:border-0"
                    >
                      <span className="text-[var(--text-secondary)] text-sm">{feat.label}</span>
                      <span className="font-medium text-sm">
                        {isNum ? (
                          isUnlimited(value as number) ? (
                            <span className="flex items-center gap-1 text-[var(--accent-gold)]">
                              <Zap className="h-3 w-3" /> Unlimited
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              {feat.key === "teamMembers" && (
                                <Users className="h-3 w-3 text-[var(--text-muted)]" />
                              )}
                              {feat.key === "scheduledPostsPerMonth" && (
                                <LayoutGrid className="h-3 w-3 text-[var(--text-muted)]" />
                              )}
                              {feat.key === "analyticsExport" && (
                                <Download className="h-3 w-3 text-[var(--text-muted)]" />
                              )}
                              {isUnlimited(value as number) ? "∞" : `${value}`}
                            </span>
                          )
                        ) : (
                          <span
                            className={cn(
                              "flex items-center gap-1",
                              value ? "text-[var(--success)]" : "text-[var(--text-muted)]",
                            )}
                          >
                            {value ? <Check className="h-3.5 w-3.5" /> : <span>—</span>}
                            {value ? "Ya" : "Tidak"}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Save/Cancel buttons when editing */}
              {isEditing && (
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={cancelEdit}>
                    Batal
                  </Button>
                  <Button size="sm" onClick={() => saveEdit(plan.id)} className="gap-2">
                    <Check className="h-3.5 w-3.5" /> Simpan
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
