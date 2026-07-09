import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "dsz_workspace",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Define all permissions for the application
const permissions = [
  // Team Work Module
  { module: "team_work", action: "create_team", description: "Create new teams" },
  { module: "team_work", action: "edit_team", description: "Edit team details" },
  { module: "team_work", action: "delete_team", description: "Delete teams" },
  { module: "team_work", action: "add_team_member", description: "Add members to teams" },
  { module: "team_work", action: "remove_team_member", description: "Remove members from teams" },
  { module: "team_work", action: "view_team", description: "View team details" },

  // Company Notices Module
  { module: "company_notices", action: "create_notice", description: "Create company notices" },
  { module: "company_notices", action: "edit_notice", description: "Edit company notices" },
  { module: "company_notices", action: "delete_notice", description: "Delete company notices" },
  { module: "company_notices", action: "publish_notice", description: "Publish company notices" },
  { module: "company_notices", action: "view_notice", description: "View company notices" },

  // Employee Directory Module
  { module: "employee_directory", action: "add_employee", description: "Add new employees" },
  { module: "employee_directory", action: "edit_employee", description: "Edit employee profiles" },
  { module: "employee_directory", action: "remove_employee", description: "Remove employees" },
  { module: "employee_directory", action: "view_employee", description: "View employee profiles" },

  // Daily Reports Module
  { module: "daily_reports", action: "create_report", description: "Create daily reports" },
  { module: "daily_reports", action: "edit_report", description: "Edit daily reports" },
  { module: "daily_reports", action: "delete_report", description: "Delete daily reports" },
  { module: "daily_reports", action: "view_report", description: "View daily reports" },
  { module: "daily_reports", action: "approve_report", description: "Approve daily reports" },

  // Reports Monitor Module
  { module: "reports_monitor", action: "view_all_reports", description: "View all reports" },
  { module: "reports_monitor", action: "export_reports", description: "Export reports" },

  // Meetings Module
  { module: "meetings", action: "create_meeting", description: "Create meetings" },
  { module: "meetings", action: "edit_meeting", description: "Edit meetings" },
  { module: "meetings", action: "delete_meeting", description: "Delete meetings" },
  { module: "meetings", action: "view_meeting", description: "View meetings" },

  // Settings & Admin Module
  { module: "settings", action: "manage_permissions", description: "Manage role permissions" },
  { module: "settings", action: "view_audit_log", description: "View audit logs" },
  { module: "settings", action: "manage_roles", description: "Manage user roles" },
];

// Define role permissions
const rolePermissions = {
  super_admin: ["all"], // Super admin gets all permissions
  admin: [
    "team_work.create_team",
    "team_work.edit_team",
    "team_work.delete_team",
    "team_work.add_team_member",
    "team_work.remove_team_member",
    "team_work.view_team",
    "company_notices.create_notice",
    "company_notices.edit_notice",
    "company_notices.delete_notice",
    "company_notices.publish_notice",
    "company_notices.view_notice",
    "employee_directory.add_employee",
    "employee_directory.edit_employee",
    "employee_directory.remove_employee",
    "employee_directory.view_employee",
    "daily_reports.view_report",
    "daily_reports.approve_report",
    "reports_monitor.view_all_reports",
    "reports_monitor.export_reports",
    "meetings.create_meeting",
    "meetings.edit_meeting",
    "meetings.delete_meeting",
    "meetings.view_meeting",
    "settings.view_audit_log",
  ],
  team_leader: [
    "team_work.view_team",
    "company_notices.view_notice",
    "employee_directory.view_employee",
    "daily_reports.create_report",
    "daily_reports.edit_report",
    "daily_reports.view_report",
    "meetings.create_meeting",
    "meetings.view_meeting",
  ],
  employee: [
    "company_notices.view_notice",
    "employee_directory.view_employee",
    "daily_reports.create_report",
    "daily_reports.edit_report",
    "daily_reports.view_report",
    "meetings.view_meeting",
  ],
};

async function seedPermissions() {
  const connection = await pool.getConnection();

  try {
    console.log("Starting permission seeding...");

    // Insert permissions
    console.log("Inserting permissions...");
    const insertedPermissions = {};

    for (const perm of permissions) {
      const [result] = await connection.execute(
        "INSERT INTO permissions (module, action, description, is_active) VALUES (?, ?, ?, true)",
        [perm.module, perm.action, perm.description]
      );
      insertedPermissions[`${perm.module}.${perm.action}`] = result.insertId;
      console.log(`✓ Created permission: ${perm.module}.${perm.action}`);
    }

    // Insert role permissions
    console.log("\nInserting role permissions...");
    for (const [role, perms] of Object.entries(rolePermissions)) {
      if (perms.includes("all")) {
        // Super admin gets all permissions
        for (const [permKey, permId] of Object.entries(insertedPermissions)) {
          await connection.execute(
            "INSERT INTO role_permissions (role, permission_id, granted) VALUES (?, ?, true)",
            [role, permId]
          );
        }
        console.log(`✓ Granted all permissions to ${role}`);
      } else {
        // Grant specific permissions
        for (const permKey of perms) {
          const permId = insertedPermissions[permKey];
          if (permId) {
            await connection.execute(
              "INSERT INTO role_permissions (role, permission_id, granted) VALUES (?, ?, true)",
              [role, permId]
            );
          }
        }
        console.log(`✓ Granted ${perms.length} permissions to ${role}`);
      }
    }

    console.log("\n✅ Permission seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding permissions:", error);
    throw error;
  } finally {
    await connection.release();
    await pool.end();
  }
}

seedPermissions().catch(console.error);
