"use client";

import { useSession } from "@/lib/auth-client";

export function useOrganization() {
  const { data: session, isPending } = useSession();

  const organizations =
    (
      session?.user as unknown as {
        organizations?: Array<{ id: string; name: string; slug: string; role: string }>;
      }
    )?.organizations || [];
  const currentOrganizationId = (session?.user as unknown as { activeOrganizationId?: string })
    ?.activeOrganizationId;

  const organization =
    organizations.find((o) => o.id === currentOrganizationId) || organizations[0];

  return {
    organization,
    organizations,
    isLoading: isPending,
    isAuthenticated: !!session,
  };
}
