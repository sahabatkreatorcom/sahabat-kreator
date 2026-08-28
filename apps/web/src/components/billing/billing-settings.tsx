"use client";

import {
  AlertTriangle,
  Building2,
  Check,
  CreditCard,
  Crown,
  Loader2,
  Shield,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlanBadge } from "@/components/ui/plan-badge";
import { cn } from "@/lib/utils";

interface BillingSettingsProps {
  tier: string;
  subscriptionStatus?: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string | null;
  trialDays?: number;
  onUpgrade?: (planId: string) => void;
  isLoading?: boolean;
  isSumopodConfigured?: boolean;
}

const PLAN_COLORS: Record<string, string> = {
  FREE: "#6B7280",
  PRO: "#8B5CF6",
  BUSINESS: "#D4A574",
  ENTERPRISE: "#F59E0B",
  ADMIN: "#EF4444",
};

const PLAN_ICONS: Record<string, React.ReactNode> = {
  PRO: <Zap className="h-5 w-5" />,
  BUSINESS: <Building2 className="h-5 w-5" />,
  ENTERPRISE: <Crown className="h-5 w-5" />,
};

const UPGRADE_PLANS = [
  {
    key: "PRO",
    name: "Pro",
    price: 99000,
    color: "#8B5CF6",
    description: "Untuk kreator yang sedang berkembang",
  },
  {
    key: "BUSINESS",
    name: "Business",
    price: 249000,
    color: "#D4A574",
    description: "Untuk tim & agensi",
  },
  {
    key: "ENTERPRISE",
    name: "Enterprise",
    price: null,
    color: "#F59E0B",
    description: "Sesuai kebutuhan Anda",
  },
];

const FEATURES = [
  { label: "Akun Media Sosial", plan: "socialAccounts" as const },
  { label: "Anggota Tim", plan: "teamMembers" as const },
  { label: "Post Terjadwal/bulan", plan: "scheduledPostsPerMonth" as const },
  { label: "AI Generations/bulan", plan: "aiGenerationsPerMonth" as const },
  { label: "Ekspor Analitik", plan: "analyticsExport" as const },
  { label: "Branding Kustom", plan: "customBranding" as const },
  { label: "Dukungan Prioritas", plan: "prioritySupport" as const },
];

const PLAN_LIMITS: Record<string, Record<string, number | boolean>> = {
  FREE: {
    socialAccounts: 3,
    teamMembers: 2,
    scheduledPostsPerMonth: 30,
    aiGenerationsPerMonth: 10,
    analyticsExport: false,
    customBranding: false,
    prioritySupport: false,
  },
  PRO: {
    socialAccounts: 10,
    teamMembers: 5,
    scheduledPostsPerMonth: 150,
    aiGenerationsPerMonth: 100,
    analyticsExport: true,
    customBranding: false,
    prioritySupport: false,
  },
  BUSINESS: {
    socialAccounts: 25,
    teamMembers: 15,
    scheduledPostsPerMonth: 500,
    aiGenerationsPerMonth: 500,
    analyticsExport: true,
    customBranding: true,
    prioritySupport: false,
  },
  ENTERPRISE: {
    socialAccounts: Number.POSITIVE_INFINITY,
    teamMembers: Number.POSITIVE_INFINITY,
    scheduledPostsPerMonth: Number.POSITIVE_INFINITY,
    aiGenerationsPerMonth: Number.POSITIVE_INFINITY,
    analyticsExport: true,
    customBranding: true,
    prioritySupport: true,
  },
  ADMIN: {
    socialAccounts: Number.POSITIVE_INFINITY,
    teamMembers: Number.POSITIVE_INFINITY,
    scheduledPostsPerMonth: Number.POSITIVE_INFINITY,
    aiGenerationsPerMonth: Number.POSITIVE_INFINITY,
    analyticsExport: true,
    customBranding: true,
    prioritySupport: true,
  },
};

function formatPrice(amount: number | null): string {
  if (amount === null) return "Hubungi Sales";
  if (amount === 0) return "Gratis";
  return `Rp ${amount.toLocaleString("id-ID")}/bulan`;
}

function formatLimit(value: number | boolean): string {
  if (typeof value === "boolean") return value ? "Ada" : "Tidak";
  if (value === Number.POSITIVE_INFINITY) return "∞";
  return value.toString();
}

export function BillingSettings({
  tier,
  subscriptionStatus,
  cancelAtPeriodEnd,
  currentPeriodEnd,
  trialDays,
  onUpgrade,
  isLoading,
  isSumopodConfigured,
}: BillingSettingsProps) {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const isAdmin = tier === "ADMIN";
  const isEnterprise = tier === "ENTERPRISE";
  const displayColor = PLAN_COLORS[tier] ?? PLAN_COLORS.FREE;

  const handleUpgrade = async (planKey: string) => {
    if (onUpgrade) {
      onUpgrade(planKey);
      return;
    }
    setCheckoutLoading(planKey);
    try {
      const response = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: planKey }),
      });
      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch {
      // Error handled by caller or toast
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Past Due Warning */}
      {subscriptionStatus === "past_due" && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/5 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--warning)]" />
          <div className="flex-1">
            <p className="font-medium text-sm">Pembayaran Gagal</p>
            <p className="text-[var(--text-muted)] text-xs">
              Mohon perbarui metode pembayaran untuk tetap aktif.
            </p>
          </div>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${displayColor}15` }}
            >
              {isAdmin ? (
                <Shield className="h-6 w-6" style={{ color: displayColor }} />
              ) : (
                <CreditCard className="h-6 w-6" style={{ color: displayColor }} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Plan Saat Ini</h3>
                <PlanBadge tier={tier} />
              </div>
              <p className="text-[var(--text-muted)] text-sm">
                {tier === "FREE" ? "Mulai dengan yang dasar" : ""}
                {tier === "PRO" ? "Untuk kreator yang sedang berkembang" : ""}
                {tier === "BUSINESS" ? "Untuk tim & agensi" : ""}
                {tier === "ENTERPRISE" ? "Unlimited everything" : ""}
                {tier === "ADMIN" ? "Internal — unlimited" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Subscription details */}
        {subscriptionStatus && !isAdmin && (
          <div className="mt-4 flex flex-wrap gap-4 text-[var(--text-muted)] text-xs">
            <span>
              Status:{" "}
              <strong className="text-[var(--text-primary)]">
                {subscriptionStatus === "active"
                  ? "Aktif"
                  : subscriptionStatus === "past_due"
                    ? "Lupa Bayar"
                    : subscriptionStatus === "trialing"
                      ? "Trial"
                      : subscriptionStatus || "Tidak Diketahui"}
              </strong>
            </span>
            {currentPeriodEnd && (
              <span>
                {cancelAtPeriodEnd ? "Batalkan" : "Perpanjang"}:{" "}
                <strong className="text-[var(--text-primary)]">
                  {new Date(currentPeriodEnd).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </strong>
              </span>
            )}
            {trialDays && trialDays > 0 && (
              <span>
                Sisa trial: <strong className="text-[var(--accent-gold)]">{trialDays} hari</strong>
              </span>
            )}
          </div>
        )}

        {isAdmin && (
          <div className="mt-4 rounded-lg border border-[var(--accent-gold)]/20 bg-[var(--accent-gold-light)] p-3">
            <p className="flex items-center gap-2 font-medium text-[var(--accent-gold)] text-sm">
              <Shield className="h-4 w-4" />
              Admin Plan — Semua fitur unlimited gratis
            </p>
          </div>
        )}
      </div>

      {/* Plan Features */}
      <div className="card p-6">
        <h3 className="mb-4 font-semibold">Fitur Plan {tier}</h3>
        <div className="space-y-3">
          {FEATURES.map((feature) => {
            const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.FREE;
            const value = limits[feature.plan];
            return (
              <div
                key={feature.plan}
                className="flex items-center justify-between border-[var(--border-light)] border-b py-2 last:border-0"
              >
                <span className="text-[var(--text-secondary)] text-sm">{feature.label}</span>
                <span
                  className={cn(
                    "font-medium text-sm",
                    typeof value === "boolean"
                      ? value
                        ? "text-[var(--success)]"
                        : "text-[var(--text-muted)]"
                      : "text-[var(--text-primary)]",
                  )}
                >
                  {typeof value === "boolean" ? (
                    value ? (
                      <Check className="h-4 w-4 text-[var(--success)]" />
                    ) : (
                      <span className="text-[var(--text-muted)]">—</span>
                    )
                  ) : (
                    formatLimit(value)
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upgrade Plans */}
      {!isAdmin && !isEnterprise && (
        <div>
          <h3 className="mb-4 font-semibold">
            {tier === "FREE" ? "Tingkatkan Plan Anda" : "Plan Tersedia"}
          </h3>

          {!isSumopodConfigured && (
            <div className="mb-4 rounded-xl border border-[var(--border)] border-dashed p-4 text-center">
              <p className="text-[var(--text-muted)] text-sm">
                Gateway pembayaran belum dikonfigurasi. Hubungi administrator.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {UPGRADE_PLANS.map((plan) => {
              const planLimits = PLAN_LIMITS[plan.key];
              const isCurrent = tier === plan.key;
              const tierOrder = ["FREE", "PRO", "BUSINESS", "ENTERPRISE"];
              const isDowngrade = tierOrder.indexOf(plan.key) < tierOrder.indexOf(tier);

              return (
                <div
                  key={plan.key}
                  className={cn(
                    "relative rounded-xl border p-5 transition-all",
                    isCurrent
                      ? "border-[var(--accent-pink)] bg-[var(--accent-pink)]/5"
                      : "border-[var(--border)] hover:border-[var(--border)]",
                  )}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span style={{ color: plan.color }}>{PLAN_ICONS[plan.key]}</span>
                    <h4 className="font-semibold">{plan.name}</h4>
                    {isCurrent && (
                      <span className="rounded-full bg-[var(--accent-pink)]/10 px-2 py-0.5 font-medium text-[10px] text-[var(--accent-pink)]">
                        Saat Ini
                      </span>
                    )}
                  </div>
                  <p className="mb-1 text-[var(--text-muted)] text-xs">{plan.description}</p>
                  <p className="mb-4 font-bold text-2xl" style={{ color: plan.color }}>
                    {formatPrice(plan.price)}
                  </p>

                  <ul className="mb-5 space-y-2">
                    {FEATURES.map((f) => (
                      <li key={f.plan} className="flex items-center gap-2 text-xs">
                        {typeof planLimits?.[f.plan] === "boolean" ? (
                          planLimits[f.plan] ? (
                            <Check className="h-3.5 w-3.5 shrink-0 text-[var(--success)]" />
                          ) : (
                            <span className="h-3.5 w-3.5 text-center text-[var(--text-muted)]">
                              —
                            </span>
                          )
                        ) : (
                          <span
                            className="h-3.5 w-3.5 shrink-0 text-center font-bold text-[10px]"
                            style={{ color: plan.color }}
                          >
                            {formatLimit(planLimits?.[f.plan] ?? 0)}
                          </span>
                        )}
                        <span
                          className={
                            typeof planLimits?.[f.plan] === "boolean" && !planLimits[f.plan]
                              ? "text-[var(--text-muted)]"
                              : ""
                          }
                        >
                          {f.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {!isCurrent && (
                    <Button
                      onClick={() => handleUpgrade(plan.key)}
                      disabled={checkoutLoading === plan.key || isDowngrade || !isSumopodConfigured}
                      className="w-full"
                      variant={isDowngrade ? "secondary" : "primary"}
                    >
                      {checkoutLoading === plan.key ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Memproses...
                        </>
                      ) : isDowngrade ? (
                        "Turun Plan"
                      ) : (
                        <>
                          <Zap className="mr-1.5 h-3.5 w-3.5" /> Naik ke {plan.name}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
