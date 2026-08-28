"use client";

import { Filter, MessageSquare, AtSign, Mail, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InboxFilterControlsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts?: Record<string, number>;
}

const FILTERS = [
  { id: "all", label: "Semua", icon: Filter },
  { id: "comment", label: "Komentar", icon: MessageSquare },
  { id: "mention", label: "Mention", icon: AtSign },
  { id: "dm", label: "Pesan", icon: Mail },
  { id: "review", label: "Review", icon: Star },
];

export function InboxFilterControls({ activeFilter, onFilterChange, counts }: InboxFilterControlsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => {
        const Icon = filter.icon;
        const count = counts?.[filter.id] || 0;
        return (
          <Button
            key={filter.id}
            variant={activeFilter === filter.id ? "primary" : "secondary"}
            size="sm"
            onClick={() => onFilterChange(filter.id)}
            className={cn(
              "gap-1.5",
              activeFilter === filter.id && "bg-[var(--accent-gold)] text-[var(--bg-primary)]",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {filter.label}
            {count > 0 && filter.id !== "all" && (
              <span className="ml-1 rounded-full bg-[var(--bg-primary)]/20 px-1.5 py-0.5 text-xs">
                {count}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
