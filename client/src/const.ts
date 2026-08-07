export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
// Returns a safe fallback URL if environment variables are missing
export const getLoginUrl = (returnPath?: string) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // Gracefully handle missing OAuth configuration
  if (!oauthPortalUrl || !appId) {
    console.warn(
      "[Auth] OAuth configuration incomplete. Missing:",
      { oauthPortalUrl: !oauthPortalUrl, appId: !appId }
    );
    // Return a safe fallback that won't crash
    return "/login-disabled";
  }

  try {
    const redirectUri = `${window.location.origin}/api/oauth/callback`;
    const state = btoa(returnPath ? `${redirectUri}|${returnPath}` : redirectUri);

    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch (error) {
    console.error("[Auth] Failed to construct login URL:", error);
    return "/login-disabled";
  }
};
