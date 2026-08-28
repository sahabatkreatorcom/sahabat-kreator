import { cn } from "@/lib/utils";

export function BadgePill({ count }: { count: number }) {
  return (
    <span
      className={cn(
        "flex h-4 min-w-4 items-center justify-center rounded-full px-1.5",
        "bg-[var(--accent-gold)] font-semibold text-[10px] text-white",
      )}
    >
      {count}
    </span>
  );
}
