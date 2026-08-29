"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ── Command Components ────────────────────────────────────────────

interface CommandProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
}

const Command = React.forwardRef<HTMLDivElement, CommandProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className,
    )}
    {...props}
  />
));
Command.displayName = "Command";

interface CommandInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const CommandInput = React.forwardRef<HTMLInputElement, CommandInputProps>(
  ({ className, ...props }, ref) => (
    <div className="flex items-center border-border border-b px-3" cmdk-input-wrapper="">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mr-2 h-4 w-4 shrink-0 opacity-50"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  ),
);
CommandInput.displayName = "CommandInput";

interface CommandListProps extends React.HTMLAttributes<HTMLDivElement> {}

const CommandList = React.forwardRef<HTMLDivElement, CommandListProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
      {...props}
    />
  ),
);
CommandList.displayName = "CommandList";

interface CommandEmptyProps extends React.HTMLAttributes<HTMLDivElement> {}

const CommandEmpty = React.forwardRef<HTMLDivElement, CommandEmptyProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("py-6 text-center text-sm", className)} {...props} />
  ),
);
CommandEmpty.displayName = "CommandEmpty";

interface CommandGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

const CommandGroup = React.forwardRef<HTMLDivElement, CommandGroupProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:text-xs",
        className,
      )}
      {...props}
    />
  ),
);
CommandGroup.displayName = "CommandGroup";

interface CommandSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}

const CommandSeparator = React.forwardRef<HTMLDivElement, CommandSeparatorProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("h-px bg-border", className)} {...props} />
  ),
);
CommandSeparator.displayName = "CommandSeparator";

interface CommandItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  onSelect?: (value: string) => void;
}

const CommandItem = React.forwardRef<HTMLDivElement, CommandItemProps>(
  ({ className, onSelect, ...props }, ref) => {
    const internalRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => internalRef.current as HTMLDivElement);

    return (
      <div
        ref={internalRef}
        className={cn(
          "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
CommandItem.displayName = "CommandItem";

// ── Command Dialog ─────────────────────────────────────────────────

interface CommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function CommandDialog({ open, onOpenChange, children }: CommandDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <Command>{children}</Command>
      </DialogContent>
    </Dialog>
  );
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
};
