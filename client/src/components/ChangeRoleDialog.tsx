import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ChangeRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  currentRole: string;
  userName: string;
  onSuccess?: () => void;
}

export function ChangeRoleDialog({
  open,
  onOpenChange,
  userId,
  currentRole,
  userName,
  onSuccess,
}: ChangeRoleDialogProps) {
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string>(currentRole);

  // Get available roles based on current user's role
  const { data: availableRoles = [] } = trpc.users.getAvailableRoles.useQuery();

  // Change role mutation
  const changeRoleMutation = trpc.users.changeRole.useMutation({
    onSuccess: () => {
      toast.success(`Role changed successfully for ${userName}`);
      onOpenChange(false);
      setSelectedRole(currentRole);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to change role");
    },
  });

  const handleChangeRole = () => {
    if (selectedRole === currentRole) {
      toast.info("Please select a different role");
      return;
    }

    changeRoleMutation.mutate({
      userId,
      newRole: selectedRole as 'super_admin' | 'admin' | 'team_leader' | 'employee',
    });
  };

  // Determine which roles to show
  const roleOptions = availableRoles.map((role) => ({
    value: role,
    label: role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, " "),
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            Change the role for {userName}. Current role: <strong>{currentRole}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">New Role</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {user?.role === "super_admin" && (
            <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
              As Super Admin, you can assign any role including Super Admin.
            </div>
          )}

          {user?.role === "admin" && (
            <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
              As Admin, you can only assign Employee and Team Leader roles.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={changeRoleMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleChangeRole}
            disabled={
              selectedRole === currentRole || changeRoleMutation.isPending
            }
          >
            {changeRoleMutation.isPending ? "Changing..." : "Change Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
