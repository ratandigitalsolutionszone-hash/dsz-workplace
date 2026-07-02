import { google } from "googleapis";
import { ENV } from "./env";
import { TRPCError } from "@trpc/server";

// Helper to get the correct redirect URI based on environment
function getRedirectUri(): string {
  // In production, use the configured domain
  if (process.env.NODE_ENV === "production") {
    return "https://dszworkspace-fkysrost.manus.space/api/oauth/gmail/callback";
  }
  // In development, use localhost
  return "http://localhost:3000/api/oauth/gmail/callback";
}

// Create OAuth2 client factory function to ensure fresh clients
function createOAuth2Client(): InstanceType<typeof google.auth.OAuth2> {
  return new google.auth.OAuth2(
    ENV.gmailClientId,
    ENV.gmailClientSecret,
    getRedirectUri()
  );
}

export function getGmailAuthUrl(userId: number): string {
  const oauth2Client = createOAuth2Client();
  const scopes = ["https://www.googleapis.com/auth/gmail.send"];
  const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString("base64");
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state,
    prompt: "consent",
  });

  return authUrl;
}

export async function exchangeCodeForToken(code: string, userId: number) {
  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to obtain access token from Gmail",
      });
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || undefined,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
    };
  } catch (error) {
    console.error("[Gmail OAuth] Error exchanging code for token:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to authenticate with Gmail",
    });
  }
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: Date } | null> {
  try {
    if (!refreshToken) {
      console.error("[Gmail OAuth] No refresh token available");
      return null;
    }

    console.log("[Gmail OAuth] Attempting to refresh access token...");
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    
    let credentials;
    try {
      const result = await oauth2Client.refreshAccessToken();
      credentials = result.credentials;
    } catch (refreshError: any) {
      console.error("[Gmail OAuth] Token refresh failed:", {
        message: refreshError.message,
        code: refreshError.code,
        status: refreshError.status,
      });
      
      // Check if it's an invalid_grant error (token revoked or expired)
      if (refreshError.message?.includes('invalid_grant')) {
        console.error("[Gmail OAuth] Refresh token is invalid or has been revoked. User needs to reconnect.");
      }
      
      return null;
    }
    
    if (!credentials.access_token) {
      console.error("[Gmail OAuth] Failed to get new access token from refresh");
      return null;
    }

    console.log("[Gmail OAuth] Successfully refreshed access token");
    return {
      accessToken: credentials.access_token,
      expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : new Date(Date.now() + 3600000),
    };
  } catch (error) {
    console.error("[Gmail OAuth] Unexpected error refreshing token:", error);
    return null;
  }
}

export async function sendEmailViaGmail(
  accessToken: string,
  to: string[],
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const emailContent = [
      `To: ${to.join(", ")}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      'Content-Type: text/html; charset="UTF-8"',
      "",
      htmlContent,
    ].join("\n");

    const base64EncodedEmail = Buffer.from(emailContent).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: base64EncodedEmail,
      },
    });

    return {
      success: true,
      messageId: response.data.id || undefined,
    };
  } catch (error) {
    console.error("[Gmail API] Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

export async function getGmailProfile(accessToken: string): Promise<{ email: string } | null> {
  try {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: "me" });

    return {
      email: profile.data.emailAddress ?? "",
    };
  } catch (error) {
    console.error("[Gmail API] Error getting profile:", error);
    return null;
  }
}
