import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  employeeProfiles,
  InsertEmployeeProfile,
  dailyReports,
  InsertDailyReport,
  companyNotices,
  InsertCompanyNotice,
  meetings,
  InsertMeeting,
  clientTasks,
  InsertClientTask,
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
      values.role = 'admin';
      updateSet.role = 'admin';
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
