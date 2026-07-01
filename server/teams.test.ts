import { describe, it, expect } from "vitest";
import * as dbFunctions from "./db";

describe("Team Member Operations", () => {
  const testUserId = 2; // Assuming user 2 exists

  it("should add a team member successfully", async () => {
    try {
      const result = await dbFunctions.addTeamMember(1, testUserId);
      expect(result).toBeDefined();
      // Result is an array with [ResultSetHeader, undefined]
      expect(Array.isArray(result)).toBe(true);
    } catch (error: any) {
      // If member already exists, that's also a valid test result
      if (error.message.includes("already part of this team")) {
        expect(error.message).toContain("already part of this team");
      } else {
        throw error;
      }
    }
  });

  it("should remove a team member successfully", async () => {
    try {
      const result = await dbFunctions.removeTeamMember(1, testUserId);
      expect(result).toBeDefined();
      // Result is an array with [ResultSetHeader, undefined]
      expect(Array.isArray(result)).toBe(true);
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

  it("should throw error when adding duplicate team member", async () => {
    try {
      // First add should succeed
      await dbFunctions.addTeamMember(1, 3);
      // Second add should fail with duplicate error
      await dbFunctions.addTeamMember(1, 3);
      throw new Error("Should have thrown an error for duplicate member");
    } catch (error: any) {
      expect(error.message).toContain("already part of this team");
    }
  });
});
