import { google } from "googleapis";
import { ENV } from "./env";
import { TRPCError } from "@trpc/server";

const oauth2Client = new google.auth.OAuth2(
  ENV.gmailClientId,
  ENV.gmailClientSecret,
  `${process.env.VITE_OAUTH_PORTAL_URL || "http://localhost:3000"}/api/oauth/gmail/callback`
);

export function getGmailAuthUrl(userId: number): string {
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

export async function sendEmailViaGmail(
  accessToken: string,
  to: string[],
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
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
