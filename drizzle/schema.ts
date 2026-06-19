import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Employee Profile Table
export const employeeProfiles = mysqlTable("employee_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  position: varchar("position", { length: 255 }),
  department: varchar("department", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 20 }),
  profilePhotoUrl: text("profile_photo_url"),
  bio: text("bio"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
}));

export type EmployeeProfile = typeof employeeProfiles.$inferSelect;
export type InsertEmployeeProfile = typeof employeeProfiles.$inferInsert;

// Daily Work Reports Table
export const dailyReports = mysqlTable("daily_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  reportDate: timestamp("report_date").notNull(),
  tasksCompleted: text("tasks_completed"),
  hoursWorked: decimal("hours_worked", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("report_user_id_idx").on(table.userId),
  reportDateIdx: index("report_date_idx").on(table.reportDate),
}));

export type DailyReport = typeof dailyReports.$inferSelect;
export type InsertDailyReport = typeof dailyReports.$inferInsert;

// Company Notices Table
export const companyNotices = mysqlTable("company_notices", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("author_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  isPinned: boolean("is_pinned").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  authorIdIdx: index("notice_author_id_idx").on(table.authorId),
  createdAtIdx: index("notice_created_at_idx").on(table.createdAt),
}));

export type CompanyNotice = typeof companyNotices.$inferSelect;
export type InsertCompanyNotice = typeof companyNotices.$inferInsert;

// Meetings Table
export const meetings = mysqlTable("meetings", {
  id: int("id").autoincrement().primaryKey(),
  createdById: int("created_by_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: varchar("location", { length: 255 }),
  attendees: text("attendees"), // JSON array of user IDs
  reminderSent: boolean("reminder_sent").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  createdByIdIdx: index("meeting_created_by_id_idx").on(table.createdById),
  startTimeIdx: index("meeting_start_time_idx").on(table.startTime),
}));

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = typeof meetings.$inferInsert;

// Client Task Requests Table
export const clientTasks = mysqlTable("client_tasks", {
  id: int("id").autoincrement().primaryKey(),
  createdById: int("created_by_id").notNull(),
  assignedToId: int("assigned_to_id"),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  createdByIdIdx: index("task_created_by_id_idx").on(table.createdById),
  assignedToIdIdx: index("task_assigned_to_id_idx").on(table.assignedToId),
  statusIdx: index("task_status_idx").on(table.status),
}));

export type ClientTask = typeof clientTasks.$inferSelect;
export type InsertClientTask = typeof clientTasks.$inferInsert;