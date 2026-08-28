"use client";

import { useSession } from "@/lib/auth-client";

export function useAuth() {
  const { data: session, isPending, error, refetch } = useSession();

  return {
    session,
    user: session?.user,
    isPending,
    isAuthenticated: !!session,
    error,
    refetch,
  };
}
