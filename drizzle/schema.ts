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
  lastEditedBy: int("last_edited_by"),
  lastEditedAt: timestamp("last_edited_at"),
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
  scheduleCronTaskUid: varchar("schedule_cron_task_uid", { length: 65 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  createdByIdIdx: index("meeting_created_by_id_idx").on(table.createdById),
  startTimeIdx: index("meeting_start_time_idx").on(table.startTime),
  scheduleCronTaskUidIdx: index("meeting_schedule_cron_task_uid_idx").on(table.scheduleCronTaskUid),
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

// Email Recipients Table
export const emailRecipients = mysqlTable("email_recipients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  recipientName: varchar("recipient_name", { length: 255 }).notNull(),
  recipientEmail: varchar("recipient_email", { length: 320 }).notNull(),
  isFrequent: boolean("is_frequent").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("email_recipient_user_id_idx").on(table.userId),
}));

export type EmailRecipient = typeof emailRecipients.$inferSelect;
export type InsertEmailRecipient = typeof emailRecipients.$inferInsert;

// Email History Table
export const emailHistory = mysqlTable("email_history", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("report_id").notNull(),
  sentById: int("sent_by_id").notNull(),
  recipients: text("recipients").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["sent", "failed", "pending"]).default("pending").notNull(),
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  reportIdIdx: index("email_history_report_id_idx").on(table.reportId),
  sentByIdIdx: index("email_history_sent_by_id_idx").on(table.sentById),
}));

export type EmailHistory = typeof emailHistory.$inferSelect;
export type InsertEmailHistory = typeof emailHistory.$inferInsert;

// Gmail Tokens Table
export const gmailTokens = mysqlTable("gmail_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  gmailEmail: varchar("gmail_email", { length: 320 }).notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("gmail_token_user_id_idx").on(table.userId),
}));

export type GmailToken = typeof gmailTokens.$inferSelect;
export type InsertGmailToken = typeof gmailTokens.$inferInsert;
// Daily Report Edit History Table
export const dailyReportEditHistory = mysqlTable("daily_report_edit_history", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("report_id").notNull(),
  editedBy: int("edited_by").notNull(),
  tasksCompleted: text("tasks_completed"),
  hoursWorked: decimal("hours_worked", { precision: 5, scale: 2 }),
  notes: text("notes"),
  editedAt: timestamp("edited_at").defaultNow().notNull(),
}, (table) => ({
  reportIdIdx: index("edit_history_report_id_idx").on(table.reportId),
  editedByIdx: index("edit_history_edited_by_idx").on(table.editedBy),
  editedAtIdx: index("edit_history_edited_at_idx").on(table.editedAt),
}));

export type DailyReportEditHistory = typeof dailyReportEditHistory.$inferSelect;
export type InsertDailyReportEditHistory = typeof dailyReportEditHistory.$inferInsert;


// Teams Table
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  teamLeaderId: int("team_leader_id").notNull(),
  createdBy: int("created_by").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  teamLeaderIdIdx: index("team_leader_id_idx").on(table.teamLeaderId),
  createdByIdx: index("team_created_by_idx").on(table.createdBy),
}));

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

// Team Members Table
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("team_id").notNull(),
  userId: int("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => ({
  teamIdIdx: index("team_members_team_id_idx").on(table.teamId),
  userIdIdx: index("team_members_user_id_idx").on(table.userId),
  teamUserUniqueIdx: index("team_members_team_user_unique").on(table.teamId, table.userId),
}));

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

// Team Reports Table (linking daily reports to teams)
export const teamReports = mysqlTable("team_reports", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("team_id").notNull(),
  reportId: int("report_id").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
}, (table) => ({
  teamIdIdx: index("team_reports_team_id_idx").on(table.teamId),
  reportIdIdx: index("team_reports_report_id_idx").on(table.reportId),
  teamReportUniqueIdx: index("team_reports_team_report_unique").on(table.teamId, table.reportId),
}));

export type TeamReport = typeof teamReports.$inferSelect;
export type InsertTeamReport = typeof teamReports.$inferInsert;
