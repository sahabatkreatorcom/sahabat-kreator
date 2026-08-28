import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const progressVariants = cva("h-full rounded-full transition-all", {
  variants: {
    variant: {
      default: "bg-[var(--accent-gold)]",
      success: "bg-[var(--success)]",
      warning: "bg-[var(--warning)]",
      danger: "bg-[var(--error)]",
      gradient: "bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-pink)]",
    },
    size: {
      sm: "h-1",
      md: "h-2",
      lg: "h-3",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value: number;
  max?: number;
  showLabel?: boolean;
}

function Progress({
  className,
  variant,
  size,
  value,
  max = 100,
  showLabel,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const isAtLimit = percentage >= 100;
  const isNearLimit = percentage >= 80 && percentage < 100;

  return (
    <div className={cn("relative w-full", className)} {...props}>
      <div className="overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
        <div
          className={cn(
            progressVariants({
              variant: isAtLimit ? "danger" : isNearLimit ? "warning" : variant,
              size,
            }),
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-right text-[var(--text-muted)] text-xs">
          {Math.round(percentage)}%
        </p>
      )}
    </div>
  );
}

export { Progress, progressVariants };
