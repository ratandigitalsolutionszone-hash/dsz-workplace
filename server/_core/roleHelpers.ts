import { TRPCError } from "@trpc/server";
import type { User } from "../../drizzle/schema";

/**
 * Role hierarchy for permission checking
 * Super Admin > Admin > Team Leader > Employee
 */
export type Role = User["role"];

/**
 * Check if user has Super Admin role
 */
export function isSuperAdmin(user: User | null | undefined): user is User {
  return user?.role === "super_admin";
}

/**
 * Check if user has Admin or higher role
 */
export function isAdmin(user: User | null | undefined): user is User {
  return user?.role === "admin" || user?.role === "super_admin";
}

/**
 * Check if user has Team Leader or higher role
 */
export function isTeamLeader(user: User | null | undefined): user is User {
  return (
    user?.role === "team_leader" ||
    user?.role === "admin" ||
    user?.role === "super_admin"
  );
}

/**
 * Check if user is an employee (any role)
 */
export function isEmployee(user: User | null | undefined): user is User {
  return user?.role === "employee" || isTeamLeader(user);
}

/**
 * Throw error if user is not Super Admin
 */
export function requireSuperAdmin(user: User | null | undefined): void {
  if (!isSuperAdmin(user)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only Super Admin can perform this action",
    });
  }
}

/**
 * Throw error if user is not Admin or Super Admin
 */
export function requireAdmin(user: User | null | undefined): void {
  if (!isAdmin(user)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
}

/**
 * Throw error if user is not Team Leader, Admin, or Super Admin
 */
export function requireTeamLeader(user: User | null | undefined): void {
  if (!isTeamLeader(user)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Team Leader access required",
    });
  }
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: Role): string {
  const roleNames: Record<Role, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    team_leader: "Team Leader",
    employee: "Employee",
  };
  return roleNames[role] || role;
}

/**
 * Check if user can manage other users (only Super Admin and Admin)
 */
export function canManageUsers(user: User | null | undefined): boolean {
  return isAdmin(user);
}

/**
 * Check if user can manage teams (only Admin and Super Admin)
 */
export function canManageTeams(user: User | null | undefined): boolean {
  return isAdmin(user);
}

/**
 * Check if user can view all reports (Admin and Super Admin)
 */
export function canViewAllReports(user: User | null | undefined): boolean {
  return isAdmin(user);
}

/**
 * Check if user can manage company notices (Admin and Super Admin)
 */
export function canManageNotices(user: User | null | undefined): boolean {
  return isAdmin(user);
}

/**
 * Check if user can manage meetings (Admin and Super Admin)
 */
export function canManageMeetings(user: User | null | undefined): boolean {
  return isAdmin(user);
}

/**
 * Check if user can change user roles (only Super Admin)
 */
export function canChangeRoles(user: User | null | undefined): boolean {
  return isSuperAdmin(user);
}

/**
 * Check if user can deactivate users (only Super Admin)
 */
export function canDeactivateUsers(user: User | null | undefined): boolean {
  return isSuperAdmin(user);
}
