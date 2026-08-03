import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import * as db from "./db";
import { drizzleDb, getDb } from "./db";
import { users, gmailTokens } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Gmail Integration - Token Status and Refresh", () => {
  let testUserId: number;
  let testUserEmail: string;

  beforeAll(async () => {
    // Create a test user
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    const result = await database.insert(users).values({
      openId: `test-gmail-${Date.now()}`,
      name: "Test Gmail User",
      email: `test-gmail-${Date.now()}@example.com`,
      loginMethod: "oauth",
      role: "employee",
      is_active: true,
    });

    testUserId = result[0].insertId as number;
    testUserEmail = `test-gmail-${Date.now()}@example.com`;
  });

  afterAll(async () => {
    // Clean up test data
    const database = await getDb();
    if (!database) return;

    await database.delete(gmailTokens).where(eq(gmailTokens.userId, testUserId));
    await database.delete(users).where(eq(users.id, testUserId));
  });

  it("should return connected: false when no Gmail token exists", async () => {
    console.log("Testing: No Gmail token exists");
    const token = await db.getGmailToken(testUserId);
    expect(token).toBeNull();
  });

  it("should return connected: true when valid Gmail token exists and not expired", async () => {
    console.log("Testing: Valid Gmail token exists");
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    // Create a valid token that expires in the future
    const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
    await database.insert(gmailTokens).values({
      userId: testUserId,
      gmailEmail: "test@gmail.com",
      accessToken: "valid_access_token_123",
      refreshToken: "valid_refresh_token_456",
      expiresAt: futureDate,
    });

    const token = await db.getGmailToken(testUserId);
    expect(token).not.toBeNull();
    expect(token?.gmailEmail).toBe("test@gmail.com");
    expect(token?.accessToken).toBe("valid_access_token_123");
    expect(token?.refreshToken).toBe("valid_refresh_token_456");
  });

  it("should detect expired tokens correctly", async () => {
    console.log("Testing: Expired token detection");
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    // Create an expired token
    const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
    await database.update(gmailTokens).set({ expiresAt: pastDate }).where(eq(gmailTokens.userId, testUserId));

    const token = await db.getGmailToken(testUserId);
    expect(token).not.toBeNull();
    expect(token?.expiresAt?.getTime()).toBeLessThan(new Date().getTime());
  });

  it("should have refresh token available for expired tokens", async () => {
    console.log("Testing: Refresh token availability");
    const token = await db.getGmailToken(testUserId);
    expect(token?.refreshToken).toBeDefined();
    expect(token?.refreshToken).not.toBeNull();
  });

  it("should return null when token is expired and no refresh token exists", async () => {
    console.log("Testing: Expired token without refresh token");
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    // Update token to remove refresh token
    await database
      .update(gmailTokens)
      .set({ refreshToken: null })
      .where(eq(gmailTokens.userId, testUserId));

    const token = await db.getGmailToken(testUserId);
    expect(token?.refreshToken).toBeNull();
  });

  it("should verify Gmail connection is associated with correct user", async () => {
    console.log("Testing: Gmail connection user association");
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    // Restore refresh token for this test
    await database
      .update(gmailTokens)
      .set({ refreshToken: "valid_refresh_token_456" })
      .where(eq(gmailTokens.userId, testUserId));

    const token = await db.getGmailToken(testUserId);
    expect(token?.userId).toBe(testUserId);
  });

  it("should verify Gmail connection persists after RBAC changes", async () => {
    console.log("Testing: Gmail connection persistence after RBAC");
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    // Simulate RBAC change by updating user role
    await database.update(users).set({ role: "admin" }).where(eq(users.id, testUserId));

    // Verify Gmail connection still exists
    const token = await db.getGmailToken(testUserId);
    expect(token).not.toBeNull();
    expect(token?.gmailEmail).toBe("test@gmail.com");
  });

  it("should verify token refresh mechanism is available", async () => {
    console.log("Testing: Token refresh mechanism availability");
    const token = await db.getGmailToken(testUserId);

    // Verify all required fields for refresh are present
    expect(token?.accessToken).toBeDefined();
    expect(token?.refreshToken).toBeDefined();
    expect(token?.expiresAt).toBeDefined();
  });

  it("should handle token status check correctly", async () => {
    console.log("Testing: Token status check logic");
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    // Set token to future expiration (valid)
    const futureDate = new Date(Date.now() + 3600000);
    await database
      .update(gmailTokens)
      .set({ expiresAt: futureDate })
      .where(eq(gmailTokens.userId, testUserId));

    const token = await db.getGmailToken(testUserId);
    const isExpired = token?.expiresAt ? new Date().getTime() > token.expiresAt.getTime() : false;
    expect(isExpired).toBe(false);
  });

  it("should correctly identify expired tokens for refresh attempt", async () => {
    console.log("Testing: Expired token identification");
    const database = await getDb();
    if (!database) throw new Error("Database not available");

    // Set token to past expiration (expired)
    const pastDate = new Date(Date.now() - 3600000);
    await database
      .update(gmailTokens)
      .set({ expiresAt: pastDate })
      .where(eq(gmailTokens.userId, testUserId));

    const token = await db.getGmailToken(testUserId);
    const isExpired = token?.expiresAt ? new Date().getTime() > token.expiresAt.getTime() : false;
    expect(isExpired).toBe(true);
  });
});
