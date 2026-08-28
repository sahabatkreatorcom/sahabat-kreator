"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  AlertTriangle,
  Building2,
  Check,
  Coins,
  CreditCard,
  Crown,
  Shield,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { billingApi } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { PlanBadge } from "./components/plan-badge";
import { PlanCard, PLAN_DISPLAY, PLAN_LIMITS, PLAN_PRICES } from "./components/plan-card";
import { UsageMeter } from "./components/usage-meter";

const UPGRADE_PLANS = ["PRO", "BUSINESS", "ENTERPRISE"] as const;

interface BillingInfo {
  tier: string;
  subscriptionStatus?: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd?: string;
  trialDays: number;
}

interface UsageData {
  socialAccounts: number;
  teamMembers: number;
  scheduledPostsPerMonth: number;
  aiGenerationsPerMonth: number;
}

export default function BillingPage() {
  const { data: session } = useSession();
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const orgId = (session?.user as unknown as { activeOrganizationId?: string })
    ?.activeOrganizationId;
  const tier = billingInfo?.tier ?? "FREE";
  const isAdmin = tier === "ADMIN";

  useEffect(() => {
    async function fetchBilling() {
      if (!orgId) return;

      const [billingRes, usageRes] = await Promise.all([
        billingApi.getInfo(),
        billingApi.getUsage(),
      ]);

      if (billingRes.ok) {
        setBillingInfo(billingRes.data);
      }
      if (usageRes.ok) {
        setUsage(usageRes.data);
      }
      setIsLoading(false);
    }

    fetchBilling();
  }, [orgId]);

  async function handleUpgrade(planKey: string) {
    if (!orgId) return;
    setCheckoutLoading(planKey);
    setError(null);
    try {
      const res = await billingApi.checkout({ planId: planKey });
      if (res.ok && res.data.checkoutUrl) {
        setCheckoutUrl(res.data.checkoutUrl);
        window.location.href = res.data.checkoutUrl;
      } else if (!res.ok) {
        setError(res.error);
      }
    } catch {
      setError("Gagal memproses pembayaran. Silakan coba lagi.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 py-16 sm:p-6 lg:p-8">
        <div className="spinner-gradient spinner-gradient-lg" />
      </div>
    );
  }

  const limits = PLAN_LIMITS[tier] ?? PLAN_LIMITS.FREE;
  const display = PLAN_DISPLAY[tier] ?? PLAN_DISPLAY.FREE;

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-semibold text-2xl">Billing & Subscription</h1>
        <p className="mt-1 text-[var(--text-secondary)] text-sm">
          Kelola paket langganan dan penggunaan Anda
        </p>
      </div>

      {/* Current Plan */}
      <div className="card mb-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${display.color}15` }}
            >
              {isAdmin ? (
                <Shield className="h-6 w-6" style={{ color: display.color }} />
              ) : (
                <CreditCard className="h-6 w-6" style={{ color: display.color }} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Paket Saat Ini</h3>
                <PlanBadge tier={tier} color={display.color} name={display.name} />
              </div>
              <p className="text-[var(--text-muted)] text-sm">{display.description}</p>
            </div>
          </div>

          {!isAdmin && tier !== "ENTERPRISE" && (
            <span className="font-medium text-[var(--text-secondary)] text-sm">
              {tier === "FREE"
                ? "Gratis"
                : `Rp ${PLAN_PRICES[tier]?.toLocaleString("id-ID") ?? "Custom"}/bulan`}
            </span>
          )}
        </div>

        {billingInfo?.currentPeriodEnd && !isAdmin && (
          <div className="mt-4 flex gap-4 text-[var(--text-muted)] text-xs">
            <span>
              Status:{" "}
              <strong className="text-[var(--text-primary)]">
                {billingInfo.subscriptionStatus === "active"
                  ? "Aktif"
                  : billingInfo.subscriptionStatus === "past_due"
                    ? "Lupa Bayar"
                    : billingInfo.subscriptionStatus === "trialing"
                      ? "Trial"
                      : "Tidak Diketahui"}
              </strong>
            </span>
            <span>
              {billingInfo.cancelAtPeriodEnd ? "Batal" : "Perpanjang"}:{" "}
              <strong className="text-[var(--text-primary)]">
                {format(new Date(billingInfo.currentPeriodEnd), "d MMM yyyy", { locale: id })}
              </strong>
            </span>
          </div>
        )}

        {isAdmin && (
          <div className="mt-4 rounded-lg border border-[var(--accent-gold)]/20 bg-[var(--accent-gold-light)] p-3">
            <p className="flex items-center gap-2 font-medium text-[var(--accent-gold)] text-sm">
              <Shield className="h-4 w-4" />
              Admin Plan — Semua fitur tak terbatas Rp 0
            </p>
          </div>
        )}
      </div>

      {/* Usage Meters */}
      {usage && (
        <div className="card mb-6 p-6">
          <h3 className="mb-4 font-semibold">Penggunaan Bulan Ini</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <UsageMeter
              label="Akun Sosial"
              current={usage.socialAccounts}
              limit={limits.socialAccounts}
            />
            <UsageMeter
              label="Anggota Tim"
              current={usage.teamMembers}
              limit={limits.teamMembers}
            />
            <UsageMeter
              label="Post Terjadwal"
              current={usage.scheduledPostsPerMonth}
              limit={limits.scheduledPostsPerMonth}
            />
            <UsageMeter
              label="AI Generations"
              current={usage.aiGenerationsPerMonth}
              limit={limits.aiGenerationsPerMonth}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-[var(--error)]/30 bg-[var(--error)]/5 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--error)]" />
          <p className="flex-1 text-[var(--error)] text-sm">{error}</p>
        </div>
      )}

      {/* Checkout URL pending */}
      {checkoutUrl && (
        <div className="mb-6 rounded-xl border border-[var(--success)]/30 bg-[var(--success-light)] p-4">
          <p className="font-medium text-[var(--success)] text-sm">
            Mengarahkan ke halaman pembayaran SumoPod...
          </p>
        </div>
      )}

      {/* Upgrade Plans */}
      {!isAdmin && tier !== "ENTERPRISE" && (
        <div>
          <h3 className="mb-4 font-semibold">
            {tier === "FREE" ? "Tingkatkan Paket Anda" : "Paket Tersedia"}
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {UPGRADE_PLANS.map((planKey) => {
              const planDisplay = PLAN_DISPLAY[planKey];
              const planLimits = PLAN_LIMITS[planKey];
              const isCurrentPlan = tier === planKey;
              const tierOrder = ["FREE", "PRO", "BUSINESS", "ENTERPRISE"];
              const isDowngrade = tierOrder.indexOf(planKey) < tierOrder.indexOf(tier);

              return (
                <PlanCard
                  key={planKey}
                  planKey={planKey}
                  display={planDisplay}
                  limits={planLimits}
                  isCurrent={isCurrentPlan}
                  isDowngrade={isDowngrade}
                  isLoading={checkoutLoading === planKey}
                  onSelect={() => handleUpgrade(planKey)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* No billing info yet */}
      {!billingInfo && !isLoading && (
        <EmptyState
          variant="billing"
          title="Belum ada langganan"
          description="Pilih paket yang sesuai untuk mengakses fitur premium."
          action={{
            label: "Lihat Paket",
            onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
          }}
        />
      )}
    </div>
  );
}
