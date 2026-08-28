"use client";

import { Check } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
    onCheckedChange?: (checked: boolean) => void;
  }
>(({ className, onCheckedChange, onChange, ...props }, ref) => {
  return (
    <label className="relative inline-flex items-center">
      <input
        type="checkbox"
        ref={ref}
        className="peer sr-only"
        onChange={(e) => {
          onChange?.(e);
          onCheckedChange?.(e.target.checked);
        }}
        {...props}
      />
      <div
        className={cn(
          "h-4 w-4 shrink-0 rounded border border-[var(--border)] bg-[var(--bg-tertiary)] transition-colors",
          "peer-checked:border-[var(--accent-gold)] peer-checked:bg-[var(--accent-gold)]",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent-gold)]/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <Check className="h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
      </div>
    </label>
  );
});
Checkbox.displayName = "Checkbox";

export { Checkbox };
