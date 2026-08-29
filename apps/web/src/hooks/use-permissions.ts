"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";

export type Role = "owner" | "admin" | "editor" | "viewer";

interface Permission {
  canCreatePosts: boolean;
  canEditPosts: boolean;
  canDeletePosts: boolean;
  canSchedulePosts: boolean;
  canPublishPosts: boolean;
  canViewAnalytics: boolean;
  canManageTeam: boolean;
  canManageSettings: boolean;
  canManageBilling: boolean;
  canManagePillars: boolean;
  canManageHashtags: boolean;
}

const ROLE_PERMISSIONS: Record<Role, Permission> = {
  owner: {
    canCreatePosts: true,
    canEditPosts: true,
    canDeletePosts: true,
    canSchedulePosts: true,
    canPublishPosts: true,
    canViewAnalytics: true,
    canManageTeam: true,
    canManageSettings: true,
    canManageBilling: true,
    canManagePillars: true,
    canManageHashtags: true,
  },
  admin: {
    canCreatePosts: true,
    canEditPosts: true,
    canDeletePosts: true,
    canSchedulePosts: true,
    canPublishPosts: true,
    canViewAnalytics: true,
    canManageTeam: false,
    canManageSettings: true,
    canManageBilling: false,
    canManagePillars: true,
    canManageHashtags: true,
  },
  editor: {
    canCreatePosts: true,
    canEditPosts: true,
    canDeletePosts: false,
    canSchedulePosts: true,
    canPublishPosts: false,
    canViewAnalytics: true,
    canManageTeam: false,
    canManageSettings: false,
    canManageBilling: false,
    canManagePillars: true,
    canManageHashtags: true,
  },
  viewer: {
    canCreatePosts: false,
    canEditPosts: false,
    canDeletePosts: false,
    canSchedulePosts: false,
    canPublishPosts: false,
    canViewAnalytics: true,
    canManageTeam: false,
    canManageSettings: false,
    canManageBilling: false,
    canManagePillars: false,
    canManageHashtags: false,
  },
};

export function usePermissions() {
  const { data: session } = useSession();
  const [permissions, setPermissions] = useState<Permission>(ROLE_PERMISSIONS.viewer);
  const [role, setRole] = useState<Role>("viewer");
  const [isLoading, setIsLoading] = useState(true);

  const checkUserPermissions = useCallback(async () => {
    try {
      const res = await fetch("/api/user/permissions");
      if (res.ok) {
        const data = await res.json();
        const userRole = data.role || "viewer";
        setRole(userRole as Role);
        setPermissions(ROLE_PERMISSIONS[userRole as Role] || ROLE_PERMISSIONS.viewer);
      }
    } catch {
      // Default to viewer permissions
      setPermissions(ROLE_PERMISSIONS.viewer);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      checkUserPermissions();
    }
  }, [session, checkUserPermissions]);

  const hasPermission = (permission: keyof Permission): boolean => {
    return permissions[permission] ?? false;
  };

  const can = (permission: keyof Permission): boolean => {
    return hasPermission(permission);
  };

  return {
    permissions,
    role,
    isLoading,
    hasPermission,
    can,
  };
}

/**
 * Hook to guard routes based on permissions
 */
export function useAuthGuard(requiredPermission: keyof Permission) {
  const { can, isLoading } = usePermissions();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    setIsAllowed(can(requiredPermission));
  }, [isLoading, can, requiredPermission]);

  return { isAllowed, isLoading };
}
