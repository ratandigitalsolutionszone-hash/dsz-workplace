import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast as sonnerToast } from "sonner";

const ROLES = ["super_admin", "admin", "team_leader", "employee"];

interface Permission {
  id: number;
  module: string;
  action: string;
  description: string | null;
  granted?: boolean | null;
}

interface PermissionsByModule {
  [key: string]: Permission[];
}

export function RolePermissionsPage() {
  const toast = (props: any) => sonnerToast.success(props.description || props.title);
  const [selectedRole, setSelectedRole] = useState<string>("admin");
  const [permissionsByModule, setPermissionsByModule] = useState<PermissionsByModule>({});
  const [changedPermissions, setChangedPermissions] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all permissions
  const { data: allPermissions, isLoading: isLoadingPermissions } = trpc.permissions.getAll.useQuery();

  // Fetch role permissions
  const { data: rolePermissions, isLoading: isLoadingRolePermissions } = trpc.permissions.getRolePermissions.useQuery(
    { role: selectedRole },
    { enabled: !!selectedRole }
  );

  // Update permission mutation
  const updatePermissionMutation = trpc.permissions.updateRolePermission.useMutation({
    onSuccess: () => {
      sonnerToast.success("Permission updated successfully");
      setChangedPermissions(new Set());
    },
    onError: (error) => {
      sonnerToast.error(error.message || "Failed to update permission");
    },
  });

  // Organize permissions by module
  useEffect(() => {
    if (!rolePermissions || !allPermissions) return;

    const organized: PermissionsByModule = {};
    const rolePermMap = new Map(rolePermissions.map((p) => [p.id, p.granted]));

    allPermissions.forEach((perm) => {
      if (!organized[perm.module]) {
        organized[perm.module] = [];
      }
      organized[perm.module].push({
        ...perm,
        granted: rolePermMap.get(perm.id) ?? false,
      });
    });

    setPermissionsByModule(organized);
  }, [rolePermissions, allPermissions]);

  const handlePermissionChange = (permissionId: number, granted: boolean) => {
    setPermissionsByModule((prev) => {
      const updated = { ...prev };
      for (const module in updated) {
        updated[module] = updated[module].map((p) =>
          p.id === permissionId ? { ...p, granted } : p
        );
      }
      return updated;
    });

    const newChanged = new Set(changedPermissions);
    if (newChanged.has(permissionId)) {
      newChanged.delete(permissionId);
    } else {
      newChanged.add(permissionId);
    }
    setChangedPermissions(newChanged);
  };

  const handleSaveChanges = async () => {
    if (changedPermissions.size === 0) {
      sonnerToast.info("No permissions were modified");
      return;
    }

    setIsSaving(true);
    try {
      const permissionIds = Array.from(changedPermissions);
      for (const permissionId of permissionIds) {
        const permission = Object.values(permissionsByModule)
          .flat()
          .find((p) => p.id === permissionId);

        if (permission) {
          await updatePermissionMutation.mutateAsync({
            role: selectedRole,
            permissionId,
            granted: permission.granted || false,
            reason: `Updated by Super Admin`,
          });
        }
      }
      setChangedPermissions(new Set());
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isLoadingPermissions || isLoadingRolePermissions;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Role & Permission Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage permissions for each role. Only Super Admin can modify these settings.
        </p>
      </div>

      <Tabs defaultValue="permissions" className="w-full">
        <TabsList>
          <TabsTrigger value="permissions">Permission Matrix</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-6">
          {/* Role Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Role</CardTitle>
              <CardDescription>Choose a role to manage its permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {ROLES.map((role) => (
                  <Button
                    key={role}
                    variant={selectedRole === role ? "default" : "outline"}
                    onClick={() => {
                      setSelectedRole(role);
                      setChangedPermissions(new Set());
                    }}
                    className="capitalize"
                  >
                    {role.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Permission Matrix */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="capitalize">
                    {selectedRole.replace("_", " ")} Permissions
                  </CardTitle>
                  <CardDescription>
                    {changedPermissions.size > 0 && (
                      <span className="text-amber-600 font-medium">
                        {changedPermissions.size} permission(s) changed
                      </span>
                    )}
                  </CardDescription>
                </div>
                {changedPermissions.size > 0 && (
                  <Button onClick={handleSaveChanges} disabled={isSaving || updatePermissionMutation.isPending}>
                    {isSaving || updatePermissionMutation.isPending ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner className="h-8 w-8" />
                </div>
              ) : Object.keys(permissionsByModule).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No permissions available
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(permissionsByModule).map(([module, permissions]) => (
                    <div key={module} className="space-y-3">
                      <h3 className="font-semibold text-sm uppercase text-muted-foreground">
                        {module.replace(/_/g, " ")}
                      </h3>
                      <div className="space-y-2 pl-4 border-l-2 border-muted">
                        {permissions.map((perm) => (
                          <div key={perm.id} className="flex items-center space-x-3 py-2">
                            <Checkbox
                              id={`perm-${perm.id}`}
                              checked={perm.granted || false}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(perm.id, checked as boolean)
                              }
                              disabled={selectedRole === "super_admin"}
                            />
                            <label
                              htmlFor={`perm-${perm.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="font-medium text-sm">{perm.action.replace(/_/g, " ")}</div>
                              <div className="text-xs text-muted-foreground">{perm.description}</div>
                            </label>
                            {changedPermissions.has(perm.id) && (
                              <Badge variant="secondary" className="text-xs">
                                Modified
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Box */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Super Admin role has all permissions by default and cannot be modified.
                Changes to other roles take effect immediately for all users with that role.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <PermissionAuditLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PermissionAuditLog() {
  const { data: auditLog, isLoading } = trpc.permissions.getAuditLog.useQuery({ limit: 100 });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!auditLog || auditLog.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          No audit log entries found
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Change Audit Log</CardTitle>
        <CardDescription>Track all permission modifications</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permission</TableHead>
                <TableHead>Changed By</TableHead>
                <TableHead>Previous</TableHead>
                <TableHead>New</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLog.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="capitalize text-sm">
                    {log.affectedRole.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.module}.{log.action}
                  </TableCell>
                  <TableCell className="text-sm">{log.changedBy}</TableCell>
                  <TableCell>
                    <Badge variant={log.previousValue ? "default" : "outline"}>
                      {log.previousValue ? "Granted" : "Denied"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.newValue ? "default" : "outline"}>
                      {log.newValue ? "Granted" : "Denied"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.reason || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
