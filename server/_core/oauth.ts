import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Gmail OAuth Callback
  app.get("/api/oauth/gmail/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const error = getQueryParam(req, "error");

    if (error) {
      console.error("[Gmail OAuth] User denied permission:", error);
      res.redirect(302, "/?gmail_error=" + encodeURIComponent(error));
      return;
    }

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const { exchangeCodeForToken, getGmailProfile } = require("./gmail");
      
      // Decode state from base64 JSON
      let userId: number;
      try {
        const decodedState = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
        userId = decodedState.userId;
        if (!userId || isNaN(userId)) {
          throw new Error("Invalid userId in state");
        }
      } catch (e) {
        console.error("[Gmail OAuth] Failed to decode state:", e);
        res.status(400).json({ error: "Invalid state parameter" });
        return;
      }

      // Exchange code for tokens
      const tokenData = await exchangeCodeForToken(code, userId);
      
      // Get Gmail profile email
      const profile = await getGmailProfile(tokenData.accessToken);
      const gmailEmail = profile?.email || "unknown@gmail.com";
      
      // Save tokens to database
      await db.saveGmailToken(userId, gmailEmail, tokenData.accessToken, tokenData.refreshToken, tokenData.expiresAt);
      
      res.redirect(302, "/?gmail_connected=true");
    } catch (error) {
      console.error("[Gmail OAuth] Callback failed", error);
      res.redirect(302, "/?gmail_error=" + encodeURIComponent("Failed to connect Gmail"));
    }
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
