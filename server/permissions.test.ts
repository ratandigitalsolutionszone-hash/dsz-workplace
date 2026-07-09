import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";

describe("Permission System Tests", () => {
  describe("getAllPermissions", () => {
    it("should return all active permissions", async () => {
      const permissions = await db.getAllPermissions();
      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions[0]).toHaveProperty("id");
      expect(permissions[0]).toHaveProperty("module");
      expect(permissions[0]).toHaveProperty("action");
    });

    it("should return permissions organized by module", async () => {
      const permissions = await db.getAllPermissions();
      const modules = new Set(permissions.map((p) => p.module));
      expect(modules.size).toBeGreaterThan(0);
      expect(modules.has("team_work")).toBe(true);
      expect(modules.has("company_notices")).toBe(true);
    });

    it("should only return active permissions", async () => {
      const permissions = await db.getAllPermissions();
      const allActive = permissions.every((p) => p.isActive === true);
      expect(allActive).toBe(true);
    });
  });

  describe("getRolePermissions", () => {
    it("should return permissions for super_admin role", async () => {
      const permissions = await db.getRolePermissions("super_admin");
      expect(permissions.length).toBeGreaterThan(0);
      const allGranted = permissions.every((p) => p.granted === true);
      expect(allGranted).toBe(true);
    });

    it("should return permissions for admin role", async () => {
      const permissions = await db.getRolePermissions("admin");
      expect(permissions.length).toBeGreaterThan(0);
      const hasGranted = permissions.some((p) => p.granted === true);
      expect(hasGranted).toBe(true);
    });

    it("should return permissions for team_leader role", async () => {
      const permissions = await db.getRolePermissions("team_leader");
      expect(permissions.length).toBeGreaterThan(0);
    });

    it("should return permissions for employee role", async () => {
      const permissions = await db.getRolePermissions("employee");
      expect(permissions.length).toBeGreaterThan(0);
    });

    it("should have fewer permissions for lower roles", async () => {
      const superAdminPerms = await db.getRolePermissions("super_admin");
      const adminPerms = await db.getRolePermissions("admin");
      const teamLeaderPerms = await db.getRolePermissions("team_leader");
      const employeePerms = await db.getRolePermissions("employee");

      const superAdminGranted = superAdminPerms.filter((p) => p.granted).length;
      const adminGranted = adminPerms.filter((p) => p.granted).length;
      const teamLeaderGranted = teamLeaderPerms.filter((p) => p.granted).length;
      const employeeGranted = employeePerms.filter((p) => p.granted).length;

      expect(superAdminGranted).toBeGreaterThanOrEqual(adminGranted);
      expect(adminGranted).toBeGreaterThanOrEqual(teamLeaderGranted);
      expect(teamLeaderGranted).toBeGreaterThanOrEqual(employeeGranted);
    });
  });

  describe("updateRolePermission", () => {
    it("should update permission and create audit log entry", async () => {
      const permissions = await db.getAllPermissions();
      const testPerm = permissions[0];

      const result = await db.updateRolePermission({
        role: "admin",
        permissionId: testPerm.id,
        granted: false,
        changedBy: 1,
        reason: "Test update",
      });

      expect(result.success).toBe(true);

      // Verify the change was recorded
      const auditLog = await db.getPermissionAuditLog(10);
      const entry = auditLog.find(
        (log) => log.permissionId === testPerm.id && log.affectedRole === "admin"
      );
      expect(entry).toBeDefined();
      expect(entry?.reason).toBe("Test update");
    });

    it("should track previous and new values in audit log", async () => {
      const permissions = await db.getAllPermissions();
      const testPerm = permissions[1];

      await db.updateRolePermission({
        role: "team_leader",
        permissionId: testPerm.id,
        granted: true,
        changedBy: 1,
        reason: "Permission grant test",
      });

      const auditLog = await db.getPermissionAuditLog(10);
      const entry = auditLog.find(
        (log) => log.permissionId === testPerm.id && log.affectedRole === "team_leader"
      );

      expect(entry).toBeDefined();
      expect(entry?.newValue).toBe(true);
    });
  });

  describe("getPermissionAuditLog", () => {
    it("should return audit log entries", async () => {
      const auditLog = await db.getPermissionAuditLog(100);
      expect(Array.isArray(auditLog)).toBe(true);
    });

    it("should include required audit log fields", async () => {
      const auditLog = await db.getPermissionAuditLog(1);
      if (auditLog.length > 0) {
        const entry = auditLog[0];
        expect(entry).toHaveProperty("id");
        expect(entry).toHaveProperty("changedBy");
        expect(entry).toHaveProperty("affectedRole");
        expect(entry).toHaveProperty("permissionId");
        expect(entry).toHaveProperty("previousValue");
        expect(entry).toHaveProperty("newValue");
        expect(entry).toHaveProperty("createdAt");
      }
    });

    it("should respect limit parameter", async () => {
      const auditLog = await db.getPermissionAuditLog(5);
      expect(auditLog.length).toBeLessThanOrEqual(5);
    });

    it("should return entries in reverse chronological order", async () => {
      const auditLog = await db.getPermissionAuditLog(10);
      if (auditLog.length > 1) {
        for (let i = 0; i < auditLog.length - 1; i++) {
          const current = new Date(auditLog[i].createdAt).getTime();
          const next = new Date(auditLog[i + 1].createdAt).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });
  });

  describe("Permission Hierarchy", () => {
    it("super_admin should have all permissions", async () => {
      const superAdminPerms = await db.getRolePermissions("super_admin");
      const allPerms = await db.getAllPermissions();

      const superAdminGranted = new Set(
        superAdminPerms.filter((p) => p.granted).map((p) => p.id)
      );

      allPerms.forEach((perm) => {
        expect(superAdminGranted.has(perm.id)).toBe(true);
      });
    });

    it("admin should not have permission management permissions", async () => {
      const adminPerms = await db.getRolePermissions("admin");
      const managePermsPermission = adminPerms.find(
        (p) => p.module === "settings" && p.action === "manage_permissions"
      );

      // Admin should not have manage_permissions permission
      if (managePermsPermission) {
        expect(managePermsPermission.granted).not.toBe(true);
      }
    });

    it("employee should have minimal permissions", async () => {
      const employeePerms = await db.getRolePermissions("employee");
      const grantedPerms = employeePerms.filter((p) => p.granted);

      // Employee should have at least some permissions but not all
      expect(grantedPerms.length).toBeGreaterThan(0);
      expect(grantedPerms.length).toBeLessThan(employeePerms.length);
    });

    it("team_leader should have team-related permissions", async () => {
      const teamLeaderPerms = await db.getRolePermissions("team_leader");
      const teamPerms = teamLeaderPerms.filter(
        (p) => p.module === "team_work" && p.granted
      );

      expect(teamPerms.length).toBeGreaterThan(0);
    });
  });

  describe("Permission Modules", () => {
    it("should have team_work module permissions", async () => {
      const allPerms = await db.getAllPermissions();
      const teamPerms = allPerms.filter((p) => p.module === "team_work");
      expect(teamPerms.length).toBeGreaterThan(0);
    });

    it("should have company_notices module permissions", async () => {
      const allPerms = await db.getAllPermissions();
      const noticePerms = allPerms.filter((p) => p.module === "company_notices");
      expect(noticePerms.length).toBeGreaterThan(0);
    });

    it("should have employee_directory module permissions", async () => {
      const allPerms = await db.getAllPermissions();
      const dirPerms = allPerms.filter((p) => p.module === "employee_directory");
      expect(dirPerms.length).toBeGreaterThan(0);
    });

    it("should have daily_reports module permissions", async () => {
      const allPerms = await db.getAllPermissions();
      const reportPerms = allPerms.filter((p) => p.module === "daily_reports");
      expect(reportPerms.length).toBeGreaterThan(0);
    });

    it("should have settings module permissions", async () => {
      const allPerms = await db.getAllPermissions();
      const settingsPerms = allPerms.filter((p) => p.module === "settings");
      expect(settingsPerms.length).toBeGreaterThan(0);
    });
  });

  describe("Permission Consistency", () => {
    it("all permissions should have unique module+action combination", async () => {
      const allPerms = await db.getAllPermissions();
      const combinations = new Set<string>();

      allPerms.forEach((perm) => {
        const key = `${perm.module}.${perm.action}`;
        expect(combinations.has(key)).toBe(false);
        combinations.add(key);
      });
    });

    it("all permissions should have descriptions", async () => {
      const allPerms = await db.getAllPermissions();
      allPerms.forEach((perm) => {
        expect(perm.description).toBeTruthy();
      });
    });

    it("role permissions should reference existing permissions", async () => {
      const allPerms = await db.getAllPermissions();
      const permIds = new Set(allPerms.map((p) => p.id));

      const roles = ["super_admin", "admin", "team_leader", "employee"];
      for (const role of roles) {
        const rolePerms = await db.getRolePermissions(role);
        rolePerms.forEach((perm) => {
          expect(permIds.has(perm.id)).toBe(true);
        });
      }
    });
  });
});
