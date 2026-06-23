import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";
import { getGmailAuthUrl } from "./_core/gmail";

describe("Gmail OAuth Configuration", () => {
  it("should have Gmail Client ID configured", () => {
    expect(ENV.gmailClientId).toBeTruthy();
    expect(ENV.gmailClientId).toMatch(/^[\w-]+\.apps\.googleusercontent\.com$/);
  });

  it("should have Gmail Client Secret configured", () => {
    expect(ENV.gmailClientSecret).toBeTruthy();
    expect(ENV.gmailClientSecret).toMatch(/^GOCSPX-[\w-]+$/);
  });

  it("should be able to generate Gmail auth URL", () => {
    const userId = 1;
    
    const authUrl = getGmailAuthUrl(userId);
    
    expect(authUrl).toBeTruthy();
    expect(authUrl).toContain("https://accounts.google.com/o/oauth2/v2/auth");
    expect(authUrl).toContain("client_id=" + ENV.gmailClientId);
    expect(authUrl).toContain("scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.send");
    expect(authUrl).toContain("access_type=offline");
    expect(authUrl).toContain("state=");
  });

  it("should encode userId in state parameter", () => {
    const userId = 42;
    
    const authUrl = getGmailAuthUrl(userId);
    const stateMatch = authUrl.match(/state=([^&]+)/);
    
    expect(stateMatch).toBeTruthy();
    const encodedState = stateMatch![1];
    const decodedState = JSON.parse(Buffer.from(encodedState, "base64").toString("utf-8"));
    
    expect(decodedState.userId).toBe(userId);
    expect(decodedState.timestamp).toBeTruthy();
  });
});
