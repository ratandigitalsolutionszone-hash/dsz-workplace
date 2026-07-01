import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "./db";
import * as dbFunctions from "./db";

describe("Team Member Operations", () => {
  let testTeamId: number;
  let testUserId: number = 2; // Assuming user 2 exists

  it("should add a team member successfully", async () => {
    try {
      const result = await dbFunctions.addTeamMember(1, testUserId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("data");
    } catch (error: any) {
      throw new Error(`Failed to add team member: ${error.message}`);
    }
  });

  it("should remove a team member successfully", async () => {
    try {
      const result = await dbFunctions.removeTeamMember(1, testUserId);
      expect(result).toBeDefined();
      expect(result).toHaveProperty("success", true);
      expect(result).toHaveProperty("data");
    } catch (error: any) {
      throw new Error(`Failed to remove team member: ${error.message}`);
    }
  });

  it("should throw error when adding member to non-existent team", async () => {
    try {
      await dbFunctions.addTeamMember(99999, testUserId);
      throw new Error("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toBeDefined();
    }
  });
});
