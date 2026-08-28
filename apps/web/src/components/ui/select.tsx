"use client";

import { Check, ChevronDown } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error("Select compound components must be used within Select");
  return ctx;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, onOpenChange: setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { open, onOpenChange } = useSelectContext();
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm focus:border-[var(--accent-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-gold)]/20 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      onClick={() => onOpenChange(!open)}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useSelectContext();
  return <span className={cn(!value && "text-[var(--text-muted)]")}>{value || placeholder}</span>;
}

function SelectContent({ children }: { children: React.ReactNode }) {
  const { open, onOpenChange } = useSelectContext();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute z-50 mt-1 max-h-60 w-full animate-slide-down overflow-auto rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] shadow-lg"
    >
      {children}
    </div>
  );
}

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

function SelectItem({ value, className, children, ...props }: SelectItemProps) {
  const { value: selected, onValueChange, onOpenChange } = useSelectContext();
  return (
    <div
      className={cn(
        "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-[var(--bg-tertiary)]",
        selected === value && "bg-[var(--accent-gold-light)]",
        className,
      )}
      onClick={() => {
        onValueChange(value);
        onOpenChange(false);
      }}
      {...props}
    >
      {selected === value && <Check className="h-4 w-4 text-[var(--accent-gold)]" />}
      <span className={cn(selected === value && "font-medium")}>{children}</span>
    </div>
  );
}

function SelectSeparator({ className }: { className?: string }) {
  return <div className={cn("my-1 h-px bg-[var(--border)]", className)} />;
}

export { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue };
