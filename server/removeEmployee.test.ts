import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Remove Employee Feature", () => {
  let drizzleDb: any;

  beforeAll(async () => {
    drizzleDb = await getDb();
    if (!drizzleDb) {
      throw new Error("Database not available for testing");
    }
  });

  it("should mark user as inactive when removing employee", async () => {
    const uniqueId = `test-remove-${Date.now()}-${Math.random()}`;
    
    const userResult = await drizzleDb.insert(users).values({
      openId: uniqueId,
      name: "Test Employee to Remove",
      email: `${uniqueId}@example.com`,
      role: "user",
      isActive: true,
      lastSignedIn: new Date(),
    });
    const userId = (userResult as any).insertId;

    const result = await db.removeEmployee(userId);
    expect(result.success).toBe(true);
    expect(result.message).toBe("Employee removed successfully");

    const updatedUser = await drizzleDb
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    expect(updatedUser.length).toBe(1);
    expect(updatedUser[0].isActive).toBe(false);

    // Cleanup
    await drizzleDb.delete(users).where(eq(users.id, userId));
  });
});
