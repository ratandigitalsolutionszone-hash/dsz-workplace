import { eq, and, desc, gte, lte, or, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  employeeProfiles,
  InsertEmployeeProfile,
  dailyReports,
  InsertDailyReport,
  dailyReportEditHistory,
  InsertDailyReportEditHistory,
  companyNotices,
  InsertCompanyNotice,
  meetings,
  InsertMeeting,
  clientTasks,
  InsertClientTask,
  emailRecipients,
  InsertEmailRecipient,
  emailHistory,
  InsertEmailHistory,
  gmailTokens,
  InsertGmailToken,
  GmailToken,
  teams,
  InsertTeam,
  teamMembers,
  InsertTeamMember,
  teamReports,
  InsertTeamReport,
  roleAuditLog,
  permissions,
  rolePermissions,
  permissionAuditLog,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'super_admin';
      updateSet.role = 'super_admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Employee Profile Queries
export async function getOrCreateEmployeeProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(employeeProfiles)
    .where(eq(employeeProfiles.userId, userId))
    .limit(1);

  if (result.length > 0) return result[0];

  // Create default profile if doesn't exist
  await db.insert(employeeProfiles).values({
    userId,
  });

  const newResult = await db
    .select()
    .from(employeeProfiles)
    .where(eq(employeeProfiles.userId, userId))
    .limit(1);

  return newResult[0];
}

export async function updateEmployeeProfile(
  userId: number,
  data: Partial<InsertEmployeeProfile>
) {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(employeeProfiles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(employeeProfiles.userId, userId));

  return getOrCreateEmployeeProfile(userId);
}

// Daily Reports Queries
export async function createDailyReport(data: InsertDailyReport) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(dailyReports).values(data);
  return result;
}

export async function getUserDailyReports(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(dailyReports)
    .where(eq(dailyReports.userId, userId))
    .orderBy((t) => t.reportDate);
}

// Company Notices Queries
export async function createCompanyNotice(data: InsertCompanyNotice) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(companyNotices).values(data);
  return result;
}

export async function getAllCompanyNotices() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(companyNotices)
    .orderBy((t) => t.createdAt);
}

export async function deleteCompanyNotice(noticeId: number) {
  const db = await getDb();
  if (!db) return false;

  await db.delete(companyNotices).where(eq(companyNotices.id, noticeId));
  return true;
}

// Meetings Queries
export async function createMeeting(data: InsertMeeting) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(meetings).values(data);
  return result;
}

export async function getAllMeetings() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(meetings)
    .orderBy((t) => t.startTime);
}

export async function updateMeeting(meetingId: number, data: Partial<InsertMeeting>) {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(meetings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(meetings.id, meetingId));

  return db.select().from(meetings).where(eq(meetings.id, meetingId)).limit(1);
}

export async function deleteMeeting(meetingId: number) {
  const db = await getDb();
  if (!db) return false;

  await db.delete(meetings).where(eq(meetings.id, meetingId));
  return true;
}

// Client Tasks Queries
export async function createClientTask(data: InsertClientTask) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(clientTasks).values(data);
  return result;
}

export async function getAllClientTasks() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(clientTasks)
    .orderBy((t) => t.createdAt);
}

export async function updateClientTask(taskId: number, data: Partial<InsertClientTask>) {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(clientTasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(clientTasks.id, taskId));

  return db.select().from(clientTasks).where(eq(clientTasks.id, taskId)).limit(1);
}

export async function deleteClientTask(taskId: number) {
  const db = await getDb();
  if (!db) return false;

  await db.delete(clientTasks).where(eq(clientTasks.id, taskId));
  return true;
}

// Employee Directory Queries
export async function getAllEmployeeProfiles() {
  const db = await getDb();
  if (!db) return [];

  // Join employee profiles with user data to get complete employee information
  // Filter to only include active users
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      employeeId: employeeProfiles.employeeId,
      position: employeeProfiles.position,
      department: employeeProfiles.department,
      phoneNumber: employeeProfiles.phoneNumber,
      bio: employeeProfiles.bio,
      profilePhotoUrl: employeeProfiles.profilePhotoUrl,
      createdAt: employeeProfiles.createdAt,
    })
    .from(users)
    .leftJoin(employeeProfiles, eq(users.id, employeeProfiles.userId))
    .where(eq(users.isActive, true))
    .orderBy((t) => t.name);

  return result;
}

export async function getEmployeeProfileById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      employeeId: employeeProfiles.employeeId,
      position: employeeProfiles.position,
      department: employeeProfiles.department,
      phoneNumber: employeeProfiles.phoneNumber,
      bio: employeeProfiles.bio,
      profilePhotoUrl: employeeProfiles.profilePhotoUrl,
      createdAt: employeeProfiles.createdAt,
    })
    .from(users)
    .leftJoin(employeeProfiles, eq(users.id, employeeProfiles.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Admin Reports Monitoring Queries
export async function getAllEmployeeReports() {
  const db = await getDb();
  if (!db) return [];

  // Join reports with user and employee profile data for admin monitoring
  const result = await db
    .select({
      id: dailyReports.id,
      userId: dailyReports.userId,
      userName: users.name,
      userEmail: users.email,
      department: employeeProfiles.department,
      reportDate: dailyReports.reportDate,
      tasksCompleted: dailyReports.tasksCompleted,
      hoursWorked: dailyReports.hoursWorked,
      notes: dailyReports.notes,
      createdAt: dailyReports.createdAt,
    })
    .from(dailyReports)
    .leftJoin(users, eq(dailyReports.userId, users.id))
    .leftJoin(employeeProfiles, eq(users.id, employeeProfiles.userId))
    .orderBy((t) => t.reportDate);

  return result;
}

export async function getEmployeeReportsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get reports for a specific employee with user and profile data
  const result = await db
    .select({
      id: dailyReports.id,
      userId: dailyReports.userId,
      userName: users.name,
      userEmail: users.email,
      department: employeeProfiles.department,
      reportDate: dailyReports.reportDate,
      tasksCompleted: dailyReports.tasksCompleted,
      hoursWorked: dailyReports.hoursWorked,
      notes: dailyReports.notes,
      createdAt: dailyReports.createdAt,
    })
    .from(dailyReports)
    .leftJoin(users, eq(dailyReports.userId, users.id))
    .leftJoin(employeeProfiles, eq(users.id, employeeProfiles.userId))
    .where(eq(dailyReports.userId, userId))
    .orderBy((t) => t.reportDate);

  return result;
}

export async function getReportStats() {
  const db = await getDb();
  if (!db) return { totalReports: 0, employeesWithReports: 0, totalHours: 0 };

  // Get summary statistics for admin dashboard
  const reports = await db.select().from(dailyReports);
  const uniqueEmployees = new Set(reports.map(r => r.userId));
  const totalHours = reports.reduce((sum, r) => sum + (parseInt(r.hoursWorked || "0") || 0), 0);

  return {
    totalReports: reports.length,
    employeesWithReports: uniqueEmployees.size,
    totalHours,
  };
}


// Email Recipients Functions
export async function addEmailRecipient(userId: number, recipientName: string, recipientEmail: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(emailRecipients).values({
    userId,
    recipientName,
    recipientEmail,
    isFrequent: false,
  });

  return result;
}

export async function getEmailRecipients(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(emailRecipients).where(eq(emailRecipients.userId, userId));
  return result;
}

export async function deleteEmailRecipient(recipientId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify the recipient belongs to the user
  const recipient = await db.select().from(emailRecipients).where(eq(emailRecipients.id, recipientId)).limit(1);
  if (!recipient.length || recipient[0].userId !== userId) {
    throw new Error("Unauthorized: recipient does not belong to this user");
  }

  await db.delete(emailRecipients).where(eq(emailRecipients.id, recipientId));
}

export async function markRecipientAsFrequent(recipientId: number, isFrequent: boolean, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify the recipient belongs to the user
  const recipient = await db.select().from(emailRecipients).where(eq(emailRecipients.id, recipientId)).limit(1);
  if (!recipient.length || recipient[0].userId !== userId) {
    throw new Error("Unauthorized: recipient does not belong to this user");
  }

  await db.update(emailRecipients).set({ isFrequent }).where(eq(emailRecipients.id, recipientId));
}

export async function updateEmailRecipient(recipientId: number, recipientName: string, recipientEmail: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify the recipient belongs to the user
  const recipient = await db.select().from(emailRecipients).where(eq(emailRecipients.id, recipientId)).limit(1);
  if (!recipient.length || recipient[0].userId !== userId) {
    throw new Error("Unauthorized: recipient does not belong to this user");
  }

  await db.update(emailRecipients).set({ recipientName, recipientEmail }).where(eq(emailRecipients.id, recipientId));
}

// Email History Functions
export async function createEmailHistory(reportId: number, sentById: number, recipients: string[], subject: string, status: "sent" | "failed" | "pending" = "pending", errorMessage?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(emailHistory).values({
    reportId,
    sentById,
    recipients: JSON.stringify(recipients),
    subject,
    status,
    errorMessage,
  });

  return result;
}

export async function getEmailHistory(reportId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(emailHistory).where(eq(emailHistory.reportId, reportId));
  return result.map(item => ({
    ...item,
    recipients: JSON.parse(item.recipients as string),
  }));
}

export async function updateEmailHistoryStatus(historyId: number, status: "sent" | "failed" | "pending", errorMessage?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(emailHistory).set({ status, errorMessage }).where(eq(emailHistory.id, historyId));
}

export async function getUserEmailHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(emailHistory).where(eq(emailHistory.sentById, userId));
  return result.map(item => ({
    ...item,
    recipients: JSON.parse(item.recipients as string),
  }));
}



// Gmail Token Functions
export async function saveGmailToken(userId: number, gmailEmail: string, accessToken: string, refreshToken?: string, expiresAt?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(gmailTokens).values({
    userId,
    gmailEmail,
    accessToken,
    refreshToken: refreshToken || null,
    expiresAt: expiresAt || null,
  }).onDuplicateKeyUpdate({
    set: {
      gmailEmail,
      accessToken,
      refreshToken: refreshToken || null,
      expiresAt: expiresAt || null,
      updatedAt: new Date(),
    },
  });
}

export async function getGmailToken(userId: number): Promise<GmailToken | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(gmailTokens).where(eq(gmailTokens.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function deleteGmailToken(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(gmailTokens).where(eq(gmailTokens.userId, userId));
}

export async function updateGmailAccessToken(userId: number, accessToken: string, expiresAt?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(gmailTokens).set({
    accessToken,
    expiresAt: expiresAt || null,
    updatedAt: new Date(),
  }).where(eq(gmailTokens.userId, userId));
}

// Daily Report Update and Edit History
export async function updateDailyReport(reportId: number, data: Partial<InsertDailyReport>) {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(dailyReports)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(dailyReports.id, reportId));

  return db.select().from(dailyReports).where(eq(dailyReports.id, reportId)).limit(1);
}

export async function getDailyReport(reportId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(dailyReports)
    .where(eq(dailyReports.id, reportId))
    .limit(1);
  
  return result[0];
}

export async function createEditHistory(data: InsertDailyReportEditHistory) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(dailyReportEditHistory).values(data);
  return result;
}

export async function getReportEditHistory(reportId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(dailyReportEditHistory)
    .where(eq(dailyReportEditHistory.reportId, reportId))
    .orderBy((t) => t.editedAt);
}

export async function deleteDailyReport(reportId: number) {
  const db = await getDb();
  if (!db) return false;

  // Delete edit history first
  await db
    .delete(dailyReportEditHistory)
    .where(eq(dailyReportEditHistory.reportId, reportId));

  // Then delete the report
  await db.delete(dailyReports).where(eq(dailyReports.id, reportId));
  return true;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  return result[0];
}

// Team Management Functions
export async function createTeam(data: { name: string; description?: string; teamLeaderId: number; createdBy: number }) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(teams).values(data);
  return result;
}

export async function getTeam(teamId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);
  
  return result[0];
}

export async function getAllTeams() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(teams);
}

export async function getUserTeams(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(teams)
    .where(or(eq(teams.teamLeaderId, userId), eq(teams.createdBy, userId)));
}

export async function updateTeam(teamId: number, data: Partial<{ name: string; description: string; teamLeaderId: number }>) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .update(teams)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(teams.id, teamId));
  
  return result;
}

export async function deleteTeam(teamId: number) {
  const db = await getDb();
  if (!db) return undefined;

  // Delete team members first
  await db.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
  // Delete team reports
  await db.delete(teamReports).where(eq(teamReports.teamId, teamId));
  // Delete team
  return db.delete(teams).where(eq(teams.id, teamId));
}

// Team Member Functions
export async function addTeamMember(teamId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  try {
    const existing = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
      .limit(1);
    
    if (existing.length > 0) {
      throw new Error('Member is already part of this team');
    }
    
    const result = await db.insert(teamMembers).values({ teamId, userId });
    return result;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to add team member');
  }
}

export async function removeTeamMember(teamId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  try {
    const result = await db
      .delete(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
    return result;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to remove team member');
  }
}

export async function getTeamMembers(teamId: number) {
  const db = await getDb();
  if (!db) return [];

  const members = await db
    .select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      joinedAt: teamMembers.joinedAt,
      userName: users.name,
      userEmail: users.email,
      userProfilePhoto: employeeProfiles.profilePhotoUrl,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .leftJoin(employeeProfiles, eq(users.id, employeeProfiles.userId))
    .where(eq(teamMembers.teamId, teamId));
  
  return members;
}

export async function getUserTeamMemberships(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId));
}

// Team Reports Functions
export async function addTeamReport(teamId: number, reportId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(teamReports).values({ teamId, reportId });
  return result;
}

export async function getTeamReports(teamId: number, filters?: { startDate?: Date; endDate?: Date; userId?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(teamMembers.teamId, teamId)];

  if (filters?.startDate) {
    conditions.push(gte(dailyReports.reportDate, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(dailyReports.reportDate, filters.endDate));
  }
  if (filters?.userId) {
    conditions.push(eq(dailyReports.userId, filters.userId));
  }

  return db
    .select({
      id: dailyReports.id,
      teamId: sql`${teamId}`,
      reportId: dailyReports.id,
      submittedAt: dailyReports.createdAt,
      reportDate: dailyReports.reportDate,
      tasksCompleted: dailyReports.tasksCompleted,
      hoursWorked: dailyReports.hoursWorked,
      notes: dailyReports.notes,
      userId: dailyReports.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .innerJoin(dailyReports, eq(users.id, dailyReports.userId))
    .where(and(...conditions));
}


export async function getTeamLeaderTeams(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(teams)
    .where(eq(teams.teamLeaderId, userId));
}


export async function getAllEmployees() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      employeeId: employeeProfiles.employeeId,
      position: employeeProfiles.position,
      department: employeeProfiles.department,
      profilePhotoUrl: employeeProfiles.profilePhotoUrl,
    })
    .from(users)
    .leftJoin(employeeProfiles, eq(users.id, employeeProfiles.userId))
    .where(eq(users.role, 'employee'));
}


// Task Reports Functions for Team Leaders and Admins
export async function getTaskReportsForTeamLeader(
  teamLeaderId: number,
  filters?: {
    teamId?: number;
    userId?: number;
    startDate?: Date;
    endDate?: Date;
    searchQuery?: string;
  }
) {
  const db = await getDb();
  if (!db) return [];

  // Get all teams where this user is the team leader
  const leaderTeams = await db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.teamLeaderId, teamLeaderId));

  const teamIds = leaderTeams.map(t => t.id);
  if (teamIds.length === 0) return [];

  // Build conditions array
  const conditions: any[] = [];

  // Filter by specific team if provided
  if (filters?.teamId) {
    conditions.push(eq(teamMembers.teamId, filters.teamId));
  } else {
    conditions.push(inArray(teamMembers.teamId, teamIds));
  }

  // Filter by user if provided
  if (filters?.userId) {
    conditions.push(eq(teamMembers.userId, filters.userId));
  }

  // Filter by date range
  if (filters?.startDate) {
    conditions.push(gte(dailyReports.reportDate, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(dailyReports.reportDate, filters.endDate));
  }

  // Build the query with proper where clause
  let results = await db
    .select({
      reportId: dailyReports.id,
      employeeName: users.name,
      employeeId: employeeProfiles.employeeId,
      employeeEmail: users.email,
      teamName: teams.name,
      reportDate: dailyReports.reportDate,
      tasksCompleted: dailyReports.tasksCompleted,
      hoursWorked: dailyReports.hoursWorked,
      notes: dailyReports.notes,
      reportStatus: dailyReports.reportStatus,
      submittedAt: dailyReports.createdAt,
      lastEditedAt: dailyReports.lastEditedAt,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .innerJoin(dailyReports, eq(users.id, dailyReports.userId))
    .leftJoin(employeeProfiles, eq(users.id, employeeProfiles.userId))
    .where(and(...conditions))
    .orderBy(desc(dailyReports.reportDate));

  // Apply search filter if provided
  if (filters?.searchQuery) {
    const searchQuery = filters.searchQuery.toLowerCase();
    results = results.filter(
      r =>
        r.employeeName?.toLowerCase().includes(searchQuery) ||
        r.employeeId?.toLowerCase().includes(searchQuery) ||
        r.tasksCompleted?.toLowerCase().includes(searchQuery)
    );
  }

  return results;
}

export async function getTaskReportsForAdmin(
  filters?: {
    teamId?: number;
    userId?: number;
    startDate?: Date;
    endDate?: Date;
    searchQuery?: string;
  }
) {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [];

  // Filter by user if provided
  if (filters?.userId) {
    conditions.push(eq(dailyReports.userId, filters.userId));
  }

  // Filter by date range
  if (filters?.startDate) {
    conditions.push(gte(dailyReports.reportDate, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(dailyReports.reportDate, filters.endDate));
  }

  // For team filter, we need to handle it differently since it's optional
  let results: any[] = [];
  
  if (filters?.teamId) {
    // If team filter is provided, join with team tables
    results = await db
      .select({
        reportId: dailyReports.id,
        employeeName: users.name,
        employeeId: employeeProfiles.employeeId,
        employeeEmail: users.email,
        teamName: teams.name,
        reportDate: dailyReports.reportDate,
        tasksCompleted: dailyReports.tasksCompleted,
        hoursWorked: dailyReports.hoursWorked,
        notes: dailyReports.notes,
        reportStatus: dailyReports.reportStatus,
        submittedAt: dailyReports.createdAt,
        lastEditedAt: dailyReports.lastEditedAt,
      })
      .from(dailyReports)
      .innerJoin(users, eq(dailyReports.userId, users.id))
      .leftJoin(employeeProfiles, eq(users.id, employeeProfiles.userId))
      .innerJoin(teamMembers, eq(users.id, teamMembers.userId))
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(and(eq(teams.id, filters.teamId), ...conditions))
      .orderBy(desc(dailyReports.reportDate));
  } else {
    // If no team filter, get all reports
    results = await db
      .select({
        reportId: dailyReports.id,
        employeeName: users.name,
        employeeId: employeeProfiles.employeeId,
        employeeEmail: users.email,
        teamName: null as any,
        reportDate: dailyReports.reportDate,
        tasksCompleted: dailyReports.tasksCompleted,
        hoursWorked: dailyReports.hoursWorked,
        notes: dailyReports.notes,
        reportStatus: dailyReports.reportStatus,
        submittedAt: dailyReports.createdAt,
        lastEditedAt: dailyReports.lastEditedAt,
      })
      .from(dailyReports)
      .innerJoin(users, eq(dailyReports.userId, users.id))
      .leftJoin(employeeProfiles, eq(users.id, employeeProfiles.userId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(dailyReports.reportDate));
  }

  // Apply search filter if provided
  if (filters?.searchQuery) {
    const searchQuery = filters.searchQuery.toLowerCase();
    results = results.filter(
      r =>
        r.employeeName?.toLowerCase().includes(searchQuery) ||
        r.employeeId?.toLowerCase().includes(searchQuery) ||
        r.tasksCompleted?.toLowerCase().includes(searchQuery)
    );
  }

  return results;
}


// Remove Employee Function
export async function removeEmployee(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // 1. Remove user from all teams
    await db.delete(teamMembers).where(eq(teamMembers.userId, userId));

    // 2. Get all reports by this user and remove team report links
    const userReports = await db
      .select({ id: dailyReports.id })
      .from(dailyReports)
      .where(eq(dailyReports.userId, userId));
    
    if (userReports.length > 0) {
      const reportIds = userReports.map(r => r.id);
      await db
        .delete(teamReports)
        .where(inArray(teamReports.reportId, reportIds));
    }

    // 3. Mark user as inactive instead of deleting
    await db.update(users).set({ isActive: false }).where(eq(users.id, userId));

    return { success: true, message: "Employee removed successfully" };
  } catch (error) {
    console.error("[Database] Error removing employee:", error);
    throw new Error("Failed to remove employee");
  }
}


// Role Management Functions with Super Admin Protection
export async function changeUserRole(
  userId: number,
  newRole: 'super_admin' | 'admin' | 'team_leader' | 'employee',
  changedByUserId: number,
  reason?: string
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Get the user to check current role
    const userToUpdate = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userToUpdate || userToUpdate.length === 0) {
      throw new Error("User not found");
    }

    const currentRole = userToUpdate[0].role;

    // Get the user making the change to verify they have permission
    const changedByUser = await db
      .select()
      .from(users)
      .where(eq(users.id, changedByUserId))
      .limit(1);

    if (!changedByUser || changedByUser.length === 0) {
      throw new Error("User making change not found");
    }

    const changerRole = changedByUser[0].role;

    // Permission validation based on changer's role
    if (changerRole === 'admin') {
      // Admin cannot change Super Admin or Admin roles
      if (currentRole === 'super_admin' || currentRole === 'admin') {
        throw new Error("Admin cannot modify Super Admin or Admin accounts");
      }
      // Admin can only assign Employee and Team Leader
      if (newRole !== 'employee' && newRole !== 'team_leader') {
        throw new Error("Admin can only assign Employee or Team Leader roles");
      }
    } else if (changerRole !== 'super_admin') {
      // Only Super Admin and Admin can change roles
      throw new Error("You do not have permission to change user roles");
    }

    // Prevent removing the last Super Admin
    if (currentRole === 'super_admin' && newRole !== 'super_admin') {
      const superAdminCount = await db
        .select()
        .from(users)
        .where(eq(users.role, 'super_admin'))
        .limit(2);

      if (superAdminCount.length === 1) {
        throw new Error("Cannot remove the last Super Admin from the system");
      }
    }

    // Update the user role
    await db.update(users)
      .set({ role: newRole })
      .where(eq(users.id, userId));

    // Log the role change in audit log
    await db.insert(roleAuditLog).values({
      userId,
      previousRole: currentRole as any,
      newRole,
      changedBy: changedByUserId,
      reason: reason || null,
      createdAt: new Date(),
    });

    return { success: true, message: `Role changed from ${currentRole} to ${newRole}` };
  } catch (error) {
    console.error("[Database] Error changing user role:", error);
    throw error;
  }
}

export async function getRoleAuditLog(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  try {
    const logs = await db
      .select({
        id: roleAuditLog.id,
        userId: roleAuditLog.userId,
        previousRole: roleAuditLog.previousRole,
        newRole: roleAuditLog.newRole,
        changedBy: roleAuditLog.changedBy,
        reason: roleAuditLog.reason,
        createdAt: roleAuditLog.createdAt,
      })
      .from(roleAuditLog)
      .orderBy(desc(roleAuditLog.createdAt))
      .limit(limit);

    return logs;
  } catch (error) {
    console.error("[Database] Error getting role audit log:", error);
    return [];
  }
}

export async function getUserRole(userId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const user = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user.length > 0 ? user[0].role : null;
  } catch (error) {
    console.error("[Database] Error getting user role:", error);
    return null;
  }
}


// Permission Management Functions
export async function getAllPermissions() {
  const db = await getDb();
  if (!db) return [];
  try {
    const perms = await db
      .select()
      .from(permissions)
      .where(eq(permissions.isActive, true))
      .orderBy(permissions.module, permissions.action);
    return perms;
  } catch (error) {
    console.error("[Database] Error getting all permissions:", error);
    return [];
  }
}

export async function getRolePermissions(role: string) {
  const db = await getDb();
  if (!db) return [];
  try {
    const perms = await db
      .select({
        id: permissions.id,
        module: permissions.module,
        action: permissions.action,
        description: permissions.description,
        granted: rolePermissions.granted,
      })
      .from(permissions)
      .leftJoin(
        rolePermissions,
        and(
          eq(rolePermissions.permissionId, permissions.id),
          sql`${rolePermissions.role} = ${role}`
        )
      )
      .where(eq(permissions.isActive, true))
      .orderBy(permissions.module, permissions.action);
    return perms;
  } catch (error) {
    console.error("[Database] Error getting role permissions:", error);
    return [];
  }
}

export async function updateRolePermission(input: {
  role: string;
  permissionId: number;
  granted: boolean;
  changedBy: number;
  reason?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Get the previous value
    const existing = await db
      .select({ granted: rolePermissions.granted })
      .from(rolePermissions)
      .where(
        and(
          sql`${rolePermissions.role} = ${input.role}`,
          eq(rolePermissions.permissionId, input.permissionId)
        )
      )
      .limit(1);

    const previousValue = existing.length > 0 ? existing[0].granted : false;

    // Update or insert the role permission
    if (existing.length > 0) {
      await db
        .update(rolePermissions)
        .set({
          granted: input.granted,
          updatedAt: new Date(),
        })
        .where(
          and(
            sql`${rolePermissions.role} = ${input.role}`,
            eq(rolePermissions.permissionId, input.permissionId)
          )
        );
    } else {
      await db.insert(rolePermissions).values({
        role: input.role as any,
        permissionId: input.permissionId,
        granted: input.granted,
      });
    }

    // Log the change in audit log
    await db.insert(permissionAuditLog).values({
      changedBy: input.changedBy,
      affectedRole: input.role as any,
      permissionId: input.permissionId,
      previousValue: previousValue,
      newValue: input.granted,
      reason: input.reason,
    });

    return { success: true };
  } catch (error) {
    console.error("[Database] Error updating role permission:", error);
    throw error;
  }
}

export async function getPermissionAuditLog(limit: number = 100, role?: string) {
  const db = await getDb();
  if (!db) return [];
  try {
    const logs = await db
      .select({
        id: permissionAuditLog.id,
        changedBy: permissionAuditLog.changedBy,
        affectedRole: permissionAuditLog.affectedRole,
        permissionId: permissionAuditLog.permissionId,
        module: permissions.module,
        action: permissions.action,
        previousValue: permissionAuditLog.previousValue,
        newValue: permissionAuditLog.newValue,
        reason: permissionAuditLog.reason,
        createdAt: permissionAuditLog.createdAt,
      })
      .from(permissionAuditLog)
      .innerJoin(permissions, eq(permissions.id, permissionAuditLog.permissionId))
      .orderBy(desc(permissionAuditLog.createdAt))
      .limit(limit);

    // Filter by role in application code if needed
    if (role) {
      return logs.filter(log => log.affectedRole === role);
    }

    return logs;
  } catch (error) {
    console.error("[Database] Error getting permission audit log:", error);
    return [];
  }
}


