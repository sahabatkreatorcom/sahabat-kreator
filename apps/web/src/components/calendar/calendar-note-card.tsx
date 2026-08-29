"use client";

import { Edit, StickyNote, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarNoteCardProps {
  note: {
    id: string;
    content: string;
    color?: string;
    date: string;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const NOTE_COLORS: Record<string, string> = {
  yellow: "border-yellow-500/50 bg-yellow-500/10",
  green: "border-green-500/50 bg-green-500/10",
  blue: "border-blue-500/50 bg-blue-500/10",
  pink: "border-pink-500/50 bg-pink-500/10",
  purple: "border-purple-500/50 bg-purple-500/10",
};

export function CalendarNoteCard({ note, onEdit, onDelete }: CalendarNoteCardProps) {
  const colorClass = NOTE_COLORS[note.color || "yellow"] || NOTE_COLORS.yellow;

  return (
    <div className={`group rounded-lg border p-2 ${colorClass}`}>
      <div className="mb-1 flex items-center gap-1">
        <StickyNote className="h-3 w-3 text-[var(--text-muted)]" />
        <span className="text-[var(--text-muted)] text-xs">Catatan</span>
        <div className="ml-auto flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={() => onEdit(note.id)}
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0"
              onClick={() => onDelete(note.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      <p className="line-clamp-3 text-xs">{note.content}</p>
    </div>
  );
}
