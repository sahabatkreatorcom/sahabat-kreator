"use client";

import { Command, CommandDialog, CommandEmpty, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { CalendarDays, Home, MessageSquare, BarChart3, Settings, User, LogOut, Plus, Search, Zap, Users, Shield } from "lucide-react";
import { useEffect, useState } from "react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandAction {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
  section?: string;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [actions, setActions] = useState<CommandAction[]>([]);

  useEffect(() => {
    setActions([
      {
        id: "home",
        label: "Dashboard",
        shortcut: "⌘D",
        icon: <Home className="h-4 w-4" />,
        action: () => { window.location.href = "/dashboard"; },
        section: "Navigasi",
      },
      {
        id: "calendar",
        label: "Kalender",
        shortcut: "⌘C",
        icon: <CalendarDays className="h-4 w-4" />,
        action: () => { window.location.href = "/calendar"; },
        section: "Navigasi",
      },
      {
        id: "compose",
        label: "Buat Post Baru",
        shortcut: "⌘N",
        icon: <Plus className="h-4 w-4" />,
        action: () => { window.location.href = "/compose"; },
        section: "Aksi",
      },
      {
        id: "analytics",
        label: "Analytics",
        shortcut: "⌘A",
        icon: <BarChart3 className="h-4 w-4" />,
        action: () => { window.location.href = "/analytics"; },
        section: "Navigasi",
      },
      {
        id: "engagement",
        label: "Engagement Inbox",
        shortcut: "⌘E",
        icon: <MessageSquare className="h-4 w-4" />,
        action: () => { window.location.href = "/engagement"; },
        section: "Navigasi",
      },
      {
        id: "settings",
        label: "Pengaturan",
        shortcut: "⌘G",
        icon: <Settings className="h-4 w-4" />,
        action: () => { window.location.href = "/settings"; },
        section: "Aksi",
      },
      {
        id: "profile",
        label: "Profil Saya",
        shortcut: "⌘P",
        icon: <User className="h-4 w-4" />,
        action: () => { window.location.href = "/settings#profile"; },
        section: "Aksi",
      },
      {
        id: "ai-suggest",
        label: "AI Caption Suggestion",
        shortcut: "⌘S",
        icon: <Zap className="h-4 w-4" />,
        action: () => { window.location.href = "/compose?mode=ai"; },
        section: "AI",
      },
      {
        id: "team",
        label: "Kelola Tim",
        shortcut: "⌘T",
        icon: <Users className="h-4 w-4" />,
        action: () => { window.location.href = "/settings#team"; },
        section: "Admin",
      },
      {
        id: "logout",
        label: "Keluar",
        shortcut: "⌘Q",
        icon: <LogOut className="h-4 w-4" />,
        action: () => { window.location.href = "/"; },
        section: "Akun",
      },
    ]);
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (!isOpen) {
          // Open dialog
          const dialog = document.querySelector('[role="dialog"]');
          dialog?.dispatchEvent(new Event("open"));
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, onClose]);

  const groupedActions = actions.reduce((acc, action) => {
    const section = action.section || "Lainnya";
    if (!acc[section]) acc[section] = [];
    acc[section].push(action);
    return acc;
  }, {} as Record<string, CommandAction[]>);

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <CommandInput placeholder="Ketik perintah atau navigasi..." />
      <CommandList>
        <CommandEmpty>Tidak ada hasil</CommandEmpty>
        {Object.entries(groupedActions).map(([section, items]) => (
          <div key={section}>
            <CommandSeparator />
            <div className="px-2 py-1.5 text-xs font-medium text-[var(--text-muted)]">
              {section}
            </div>
            {items.map((item) => (
              <CommandItem
                key={item.id}
                onSelect={item.action}
                className="flex items-center justify-between gap-3"
              >
                <span className="flex items-center gap-2">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                {item.shortcut && (
                  <kbd className="rounded bg-[var(--bg-secondary)] px-1.5 py-0.5 font-mono text-[var(--text-muted)] text-xs">
                    {item.shortcut}
                  </kbd>
                )}
              </CommandItem>
            ))}
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

// Export a custom hook to trigger the command palette
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return { isOpen, setIsOpen };
}
