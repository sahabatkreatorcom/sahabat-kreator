"use client";

import { Check, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { showErrorToast } from "@/lib/api-error";
import { signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
  accentColor: string;
  accentColorAlt: string;
}

interface OrganizationSwitcherProps {
  isExpanded?: boolean;
}

function getRoleBadgeStyles(role: string): string {
  switch (role.toUpperCase()) {
    case "OWNER":
      return "bg-amber-500/20 text-amber-400";
    case "ADMIN":
      return "bg-purple-500/20 text-purple-400";
    case "MEMBER":
      return "bg-blue-500/20 text-blue-400";
    case "VIEWER":
      return "bg-gray-500/20 text-gray-400";
    default:
      return "bg-gray-500/20 text-gray-400";
  }
}

export function OrganizationSwitcher({ isExpanded = true }: OrganizationSwitcherProps) {
  const { data: session, refetch } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const organizations =
    (session?.user as unknown as { organizations?: Organization[] })?.organizations || [];
  const currentOrganizationId = (session?.user as unknown as { activeOrganizationId?: string })
    ?.activeOrganizationId;
  const currentOrg = organizations.find((org) => org.id === currentOrganizationId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (organizations.length <= 1) {
    return null;
  }

  async function handleSwitch(orgId: string) {
    if (orgId === currentOrganizationId || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/organization/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId }),
      });

      if (!response.ok) {
        throw new Error("Gagal beralih organisasi");
      }

      await refetch();
      setIsOpen(false);
      router.refresh();
      window.location.reload();
    } catch (error) {
      showErrorToast(error, "Gagal beralih organisasi");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div ref={dropdownRef} className="relative px-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        title={!isExpanded ? currentOrg?.name : undefined}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-3 py-2",
          "bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)]/80",
          "border border-[var(--border)] transition-colors",
          "text-left font-medium text-[var(--text-primary)] text-sm",
          isLoading && "cursor-wait opacity-50",
        )}
      >
        <div
          className="h-4 w-4 shrink-0 rounded-full"
          style={{
            background: `linear-gradient(135deg, ${currentOrg?.accentColor || "#D4A574"}, ${currentOrg?.accentColorAlt || "#E8B4B8"})`,
          }}
        />
        {isExpanded && (
          <>
            <span className="flex-1 truncate">{currentOrg?.name || "Pilih Organisasi"}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform",
                isOpen && "rotate-180",
              )}
            />
          </>
        )}
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute top-full right-2 left-2 z-50 mt-1",
            "rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]",
            "shadow-black/20 shadow-xl",
            "max-h-64 overflow-y-auto",
          )}
        >
          <div className="p-1">
            {organizations.map((org) => {
              const isActive = org.id === currentOrganizationId;
              return (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => handleSwitch(org.id)}
                  disabled={isLoading}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2",
                    "text-left text-sm transition-colors",
                    isActive
                      ? "bg-[var(--accent-gold-light)] text-[var(--accent-gold)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
                  )}
                >
                  {isActive ? (
                    <Check className="h-4 w-4 shrink-0" />
                  ) : (
                    <div
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{
                        background: `linear-gradient(135deg, ${org.accentColor || "#D4A574"}, ${org.accentColorAlt || "#E8B4B8"})`,
                      }}
                    />
                  )}
                  <span className="flex-1 truncate">{org.name}</span>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 font-semibold text-[10px] uppercase",
                      getRoleBadgeStyles(org.role),
                    )}
                  >
                    {org.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
