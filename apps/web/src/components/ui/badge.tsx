import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold text-xs transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--accent-gold)] text-white",
        secondary: "border-transparent bg-[var(--bg-tertiary)] text-[var(--text-secondary)]",
        success: "border-transparent bg-[var(--success-light)] text-[var(--success)]",
        warning: "border-transparent bg-[var(--warning-light)] text-[var(--warning)]",
        danger: "border-transparent bg-[var(--error-light)] text-[var(--error)]",
        outline: "text-[var(--text-secondary)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
