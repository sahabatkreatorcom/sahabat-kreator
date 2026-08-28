/**
 * Undo Toast Component
 * Specialized toast with countdown progress for undoable actions
 */

"use client";

import { Undo2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { type UndoableAction, useUndoStore } from "@/lib/undo-store";
import { cn } from "@/lib/utils";

// ============================================================================
// Undo Toast Component
// ============================================================================

interface UndoToastProps {
  action: UndoableAction;
  onDismiss: () => void;
}

/**
 * Individual undo toast with countdown progress
 */
function UndoToast({ action, onDismiss }: UndoToastProps) {
  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(false);
  const undo = useUndoStore((s) => s.undo);

  const TOTAL_DURATION = 5000; // 5 seconds

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setIsVisible(true));

    // Start countdown
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / TOTAL_DURATION) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        setIsVisible(false);
        setTimeout(onDismiss, 200);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [onDismiss]);

  const handleUndo = useCallback(async () => {
    const success = await undo(action.id);
    if (success) {
      setIsVisible(false);
      setTimeout(onDismiss, 200);
    }
  }, [undo, action.id, onDismiss]);

  return (
    <div
      className={cn(
        "relative flex w-80 items-center gap-3 overflow-hidden rounded-lg bg-[var(--bg-primary)] p-4 shadow-lg ring-1 ring-[var(--border)] transition-all duration-200",
        isVisible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0",
      )}
    >
      {/* Progress bar */}
      <div className="absolute right-0 bottom-0 left-0 h-1 bg-[var(--bg-tertiary)]">
        <div
          className="h-full bg-[var(--accent-gold)] transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-[var(--text-primary)] text-sm">{action.description}</p>
        <p className="text-[var(--text-muted)] text-xs">
          {Math.ceil((progress / 100) * 5)}s untuk undo
        </p>
      </div>

      {/* Undo button */}
      <button
        onClick={handleUndo}
        className="flex items-center gap-1.5 rounded-md bg-[var(--accent-gold)] px-3 py-1.5 font-medium text-sm text-white transition-all duration-150 hover:bg-[var(--accent-gold-dark)] active:scale-95"
      >
        <Undo2 className="h-4 w-4" />
        Undo
      </button>

      {/* Dismiss */}
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onDismiss, 200);
        }}
        className="flex-shrink-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ============================================================================
// Undo Toast Provider
// ============================================================================

/**
 * Provider component that renders undo toasts for active actions
 */
export function UndoToastProvider() {
  const actions = useUndoStore((s) => s.actions);
  const clear = useUndoStore((s) => s.clear);

  // Filter to only show active (not undone, not executed) actions
  const activeActions = actions.filter((a) => !a.undone && !a.executed);

  if (activeActions.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
      {activeActions.map((action) => (
        <UndoToast key={action.id} action={action} onDismiss={() => clear(action.id)} />
      ))}
    </div>
  );
}

// ============================================================================
// Hook for showing undo toasts
// ============================================================================

/**
 * Hook to trigger an undoable action with toast feedback
 */
export function useUndoToast() {
  const push = useUndoStore((s) => s.push);

  const showUndoToast = useCallback(
    (params: {
      type: "delete_post" | "reschedule_post" | "remove_media";
      description: string;
      onUndo: () => Promise<void>;
      onExecute?: () => Promise<void>;
    }) => {
      return push({
        type: params.type,
        description: params.description,
        undo: params.onUndo,
        execute: params.onExecute,
      });
    },
    [push],
  );

  return showUndoToast;
}
