import {
  BarChart3,
  Calendar,
  Clock,
  CreditCard,
  FolderOpen,
  Image,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateVariant =
  | "media"
  | "calendar"
  | "analytics"
  | "queue"
  | "team"
  | "engagement"
  | "ai"
  | "folder"
  | "search"
  | "billing"
  | "settings"
  | "default";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title: string;
  description?: string;
  tip?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const variantConfig: Record<EmptyStateVariant, { icon: typeof Image; gradient: string }> = {
  media: { icon: Image, gradient: "from-purple-400 to-pink-400" },
  calendar: { icon: Calendar, gradient: "from-blue-400 to-cyan-400" },
  analytics: { icon: BarChart3, gradient: "from-green-400 to-emerald-400" },
  queue: { icon: Clock, gradient: "from-orange-400 to-amber-400" },
  team: { icon: Users, gradient: "from-indigo-400 to-purple-400" },
  engagement: { icon: MessageSquare, gradient: "from-pink-400 to-rose-400" },
  ai: {
    icon: Sparkles,
    gradient: "from-[var(--accent-gold)] to-[var(--accent-pink)]",
  },
  folder: { icon: FolderOpen, gradient: "from-slate-400 to-gray-400" },
  search: { icon: Search, gradient: "from-teal-400 to-cyan-400" },
  billing: {
    icon: CreditCard,
    gradient: "from-[var(--accent-gold)] to-[var(--accent-pink)]",
  },
  settings: {
    icon: Settings,
    gradient: "from-slate-400 to-slate-500",
  },
  default: {
    icon: FolderOpen,
    gradient: "from-[var(--accent-gold)] to-[var(--accent-pink)]",
  },
};

export function EmptyState({
  variant = "default",
  title,
  description,
  tip,
  action,
  className,
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex animate-fade-in flex-col items-center justify-center px-8 py-16 text-center",
        className,
      )}
    >
      <div className="relative mb-6">
        <div
          className={cn(
            "absolute inset-0 scale-150 rounded-full opacity-20 blur-2xl",
            `bg-gradient-to-br ${config.gradient}`,
          )}
        />
        <div
          className={cn(
            "glass-card interactive-scale-subtle relative flex h-24 w-24 items-center justify-center rounded-2xl",
          )}
        >
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              `bg-gradient-to-br ${config.gradient}`,
            )}
          >
            <Icon className="h-6 w-6 text-white" strokeWidth={1.75} />
          </div>
        </div>
        <div className="absolute -top-2 -right-2 h-3 w-3 animate-pulse rounded-full bg-[var(--accent-gold)] opacity-60" />
        <div
          className="absolute -bottom-1 -left-3 h-2 w-2 animate-pulse rounded-full bg-[var(--accent-pink)] opacity-50"
          style={{ animationDelay: "0.5s" }}
        />
      </div>

      <h3 className="mb-2 font-semibold text-[var(--text-primary)] text-lg">{title}</h3>

      {description && (
        <p className="mb-4 max-w-sm text-[var(--text-secondary)] text-sm">{description}</p>
      )}

      {tip && <p className="mb-6 max-w-sm text-[var(--text-muted)] text-xs">💡 {tip}</p>}

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="btn-interactive inline-flex items-center gap-2 rounded-lg bg-gradient px-4 py-2 font-medium text-sm text-white shadow-sm hover:opacity-90"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function EmptyStateCompact({
  title,
  description,
  className,
}: Pick<EmptyStateProps, "title" | "description" | "className">) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center px-4 py-8 text-center", className)}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-tertiary)]">
        <FolderOpen className="h-5 w-5 text-[var(--text-muted)]" strokeWidth={1.75} />
      </div>
      <p className="font-medium text-[var(--text-secondary)] text-sm">{title}</p>
      {description && <p className="mt-1 text-[var(--text-muted)] text-xs">{description}</p>}
    </div>
  );
}
