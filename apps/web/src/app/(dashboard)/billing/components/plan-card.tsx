"use client";

import { Building2, Crown, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const PLAN_ICONS: Record<string, React.ReactNode> = {
  PRO: <Zap className="h-5 w-5" />,
  BUSINESS: <Building2 className="h-5 w-5" />,
  ENTERPRISE: <Crown className="h-5 w-5" />,
};

export const PLAN_PRICES: Record<string, number> = {
  PRO: 99_000,
  BUSINESS: 249_000,
  ENTERPRISE: 0,
};

export const PLAN_LIMITS: Record<
  string,
  {
    socialAccounts: number;
    teamMembers: number;
    scheduledPostsPerMonth: number;
    aiGenerationsPerMonth: number;
  }
> = {
  FREE: {
    socialAccounts: 3,
    teamMembers: 2,
    scheduledPostsPerMonth: 30,
    aiGenerationsPerMonth: 10,
  },
  PRO: {
    socialAccounts: 10,
    teamMembers: 5,
    scheduledPostsPerMonth: 150,
    aiGenerationsPerMonth: 100,
  },
  BUSINESS: {
    socialAccounts: 25,
    teamMembers: 15,
    scheduledPostsPerMonth: 500,
    aiGenerationsPerMonth: 500,
  },
  ENTERPRISE: {
    socialAccounts: Number.POSITIVE_INFINITY,
    teamMembers: Number.POSITIVE_INFINITY,
    scheduledPostsPerMonth: Number.POSITIVE_INFINITY,
    aiGenerationsPerMonth: Number.POSITIVE_INFINITY,
  },
  ADMIN: {
    socialAccounts: Number.POSITIVE_INFINITY,
    teamMembers: Number.POSITIVE_INFINITY,
    scheduledPostsPerMonth: Number.POSITIVE_INFINITY,
    aiGenerationsPerMonth: Number.POSITIVE_INFINITY,
  },
};

export interface PlanConfig {
  name: string;
  description: string;
  color: string;
}

export const PLAN_DISPLAY: Record<string, PlanConfig> = {
  FREE: { name: "Gratis", description: "Mulai dengan yang dasar", color: "#6B7280" },
  PRO: { name: "Pro", description: "Untuk brand yang berkembang", color: "#8B5CF6" },
  BUSINESS: { name: "Business", description: "Untuk tim & agensi", color: "#D4A574" },
  ENTERPRISE: { name: "Enterprise", description: "Tak terbatas semuanya", color: "#F59E0B" },
  ADMIN: { name: "Admin", description: "Internal — tak terbatas", color: "#EF4444" },
};

export function PlanCard({
  planKey,
  display,
  limits,
  isCurrent,
  isDowngrade,
  isLoading,
  onSelect,
}: {
  planKey: string;
  display: PlanConfig;
  limits: {
    socialAccounts: number;
    teamMembers: number;
    scheduledPostsPerMonth: number;
    aiGenerationsPerMonth: number;
  };
  isCurrent: boolean;
  isDowngrade: boolean;
  isLoading: boolean;
  onSelect: () => void;
}) {
  const features = [
    {
      label: "Akun sosial",
      value: Number.isFinite(limits.socialAccounts)
        ? limits.socialAccounts.toString()
        : "Tak terbatas",
    },
    {
      label: "Anggota tim",
      value: Number.isFinite(limits.teamMembers) ? limits.teamMembers.toString() : "Tak terbatas",
    },
    {
      label: "Post/bulan",
      value: Number.isFinite(limits.scheduledPostsPerMonth)
        ? limits.scheduledPostsPerMonth.toString()
        : "Tak terbatas",
    },
    {
      label: "AI generasi/bulan",
      value: Number.isFinite(limits.aiGenerationsPerMonth)
        ? limits.aiGenerationsPerMonth.toString()
        : "Tak terbatas",
    },
  ];

  return (
    <div
      className={cn(
        "relative rounded-xl border p-5 transition-all",
        isCurrent
          ? "border-[var(--accent-pink)] bg-[var(--accent-pink)]/5"
          : "border-[var(--border)] hover:border-[var(--border)]/80",
      )}
    >
      <div className="mb-1 flex items-center gap-2">
        <span style={{ color: display.color }}>{PLAN_ICONS[planKey]}</span>
        <h4 className="font-semibold">{display.name}</h4>
        {isCurrent && (
          <span className="rounded-full bg-[var(--accent-pink)]/10 px-2 py-0.5 font-medium text-[10px] text-[var(--accent-pink)]">
            Saat Ini
          </span>
        )}
      </div>
      <p className="mb-1 text-[var(--text-muted)] text-xs">{display.description}</p>
      <p className="mb-4 font-bold text-lg" style={{ color: display.color }}>
        {display.name === "Enterprise"
          ? "Custom"
          : `Rp ${PLAN_PRICES[planKey]?.toLocaleString("id-ID") ?? "0"}`}
        <span className="font-normal text-[var(--text-muted)] text-xs">/bulan</span>
      </p>

      <ul className="mb-5 space-y-2">
        {features.map((f) => (
          <li key={f.label} className="flex items-center gap-2 text-xs">
            <span
              className="h-3.5 w-3.5 shrink-0 text-center font-bold text-[10px]"
              style={{ color: display.color }}
            >
              {f.value}
            </span>
            <span className="text-[var(--text-secondary)]">{f.label}</span>
          </li>
        ))}
      </ul>

      {!isCurrent && (
        <button
          onClick={onSelect}
          disabled={isLoading || isDowngrade}
          className={cn(
            "btn-interactive w-full rounded-lg py-2.5 font-medium text-sm transition-all",
            isDowngrade
              ? "cursor-not-allowed border border-[var(--border)] text-[var(--text-muted)]"
              : "bg-gradient text-white",
          )}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Memproses...
            </span>
          ) : isDowngrade ? (
            "Turun Paket"
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Zap className="h-3.5 w-3.5" />
              Upgrade ke {display.name}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
