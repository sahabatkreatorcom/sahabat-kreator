import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const planBadgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wider",
  {
    variants: {
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-3 py-1 text-xs",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  },
);

interface PlanBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof planBadgeVariants> {
  tier: string;
  color?: string;
  name?: string;
}

const PLAN_COLORS: Record<string, string> = {
  FREE: "#6B7280",
  PRO: "#8B5CF6",
  BUSINESS: "#D4A574",
  ENTERPRISE: "#F59E0B",
  ADMIN: "#EF4444",
};

const PLAN_NAMES: Record<string, string> = {
  FREE: "Free",
  PRO: "Pro",
  BUSINESS: "Business",
  ENTERPRISE: "Enterprise",
  ADMIN: "Admin",
};

function PlanBadge({ className, size, tier, color, name, ...props }: PlanBadgeProps) {
  const activeColor = color || PLAN_COLORS[tier] || PLAN_COLORS.FREE;
  const activeName = name || PLAN_NAMES[tier] || tier;

  return (
    <span
      className={cn(planBadgeVariants({ size, className }))}
      style={{
        backgroundColor: `${activeColor}20`,
        color: activeColor,
        border: `1px solid ${activeColor}40`,
      }}
      {...props}
    >
      {tier === "ADMIN" && (
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
        </svg>
      )}
      {activeName}
    </span>
  );
}

export { PlanBadge, planBadgeVariants };
