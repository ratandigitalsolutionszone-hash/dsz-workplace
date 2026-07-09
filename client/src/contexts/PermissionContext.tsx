import React, { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface PermissionContextType {
  permissions: Set<string>;
  hasPermission: (module: string, action: string) => boolean;
  isLoading: boolean;
  refetch: () => void;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch role permissions
  const { data: rolePermissions, refetch } = trpc.permissions.getRolePermissions.useQuery(
    { role: user?.role || "employee" },
    { enabled: !!user }
  );

  useEffect(() => {
    if (!rolePermissions) {
      setIsLoading(true);
      return;
    }

    // Build permission set from granted permissions
    const permSet = new Set<string>();
    rolePermissions.forEach((perm) => {
      if (perm.granted) {
        permSet.add(`${perm.module}.${perm.action}`);
      }
    });

    setPermissions(permSet);
    setIsLoading(false);
  }, [rolePermissions]);

  const hasPermission = (module: string, action: string): boolean => {
    return permissions.has(`${module}.${action}`);
  };

  const value: PermissionContextType = {
    permissions,
    hasPermission,
    isLoading,
    refetch: () => refetch(),
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermission must be used within PermissionProvider");
  }
  return context;
}

// Helper component to conditionally render based on permission
export function PermissionGate({
  module,
  action,
  children,
  fallback = null,
}: {
  module: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasPermission, isLoading } = usePermission();

  if (isLoading) {
    return fallback;
  }

  return hasPermission(module, action) ? children : fallback;
}
