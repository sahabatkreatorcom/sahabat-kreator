"use client";

import { createContext, type ReactNode, useContext } from "react";

export interface DashboardSession {
  userId: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
  currentOrganizationId: string;
  isSuperAdmin: boolean;
}

const SessionContext = createContext<DashboardSession | null>(null);

export function useDashboardSession(): DashboardSession {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error("useDashboardSession must be used within a <DashboardSessionProvider>");
  }
  return session;
}

interface DashboardSessionProviderProps {
  session: DashboardSession;
  children: ReactNode;
}

export function DashboardSessionProvider({ session, children }: DashboardSessionProviderProps) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}
