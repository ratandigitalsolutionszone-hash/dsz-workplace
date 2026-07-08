import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { users } from "../../drizzle/schema";
import { getDb } from "../db";

/**
 * Get count of Super Admin users in the system
 */
export async function getSuperAdminCount(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const result = await db
      .select({ count: users.id })
      .from(users)
      .where(eq(users.role, "super_admin"));
    return result.length;
  } catch (error) {
    console.error("[SuperAdminProtection] Error getting Super Admin count:", error);
    return 0;
  }
}

/**
 * Check if a user is the last Super Admin
 */
export async function isLastSuperAdmin(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Get the user to check if they are Super Admin
    const user = await db.select().from(users).where(eq(users.id, userId));
    if (!user[0] || user[0].role !== "super_admin") {
      return false;
    }

    // Count total Super Admins
    const superAdminCount = await getSuperAdminCount();
    return superAdminCount === 1;
  } catch (error) {
    console.error("[SuperAdminProtection] Error checking if last Super Admin:", error);
    return false;
  }
}

/**
 * Prevent deactivation of the last Super Admin
 */
export function checkCanDeactivateUser(
  targetUserId: number,
  targetUserRole: string,
  isLastSuperAdmin: boolean
): void {
  if (targetUserRole === "super_admin" && isLastSuperAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cannot deactivate the last Super Admin in the system",
    });
  }
}

/**
 * Prevent role change of the last Super Admin
 */
export function checkCanChangeRole(
  targetUserId: number,
  targetUserRole: string,
  newRole: string,
  isLastSuperAdmin: boolean
): void {
  // Prevent downgrading the last Super Admin
  if (targetUserRole === "super_admin" && newRole !== "super_admin" && isLastSuperAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cannot downgrade the last Super Admin in the system",
    });
  }

  // Prevent changing the last Super Admin's role at all
  if (targetUserRole === "super_admin" && isLastSuperAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cannot modify the last Super Admin in the system",
    });
  }
}
