import { COOKIE_NAME } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function parseState(state: string): { origin: string; returnPath?: string } {
  try {
    const decoded = Buffer.from(state, 'base64').toString('utf-8');

    // Try JSON format first (new format)
    try {
      const parsed = JSON.parse(decoded);
      if (parsed.origin) {
        return { origin: parsed.origin, returnPath: parsed.returnPath || "/" };
      }
    } catch {
      // Not JSON - it's a redirectUri string (old format)
    }

    // Old format: state is base64(redirectUri) e.g. "https://domain.com/api/oauth/callback"
    // Extract origin from the URL
    const url = new URL(decoded);
    return { origin: url.origin, returnPath: "/" };
  } catch {
    return { origin: "", returnPath: "/" };
  }
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export async function registerOAuthRoutes(app: Express) {
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

      // Validate email domain
      const email = userInfo.email ?? null;
      if (!email || !email.endsWith('@escola.pr.gov.br')) {
        // Redirect to login page with error message instead of returning 403 JSON
        const { origin } = parseState(state);
        const fallbackOrigin = origin || (req.protocol + '://' + req.get('host'));
        res.redirect(302, fallbackOrigin + '/?error=invalid_email');
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: email,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      // Create wallet for user if it doesn't exist
      await db.createWalletIfNotExists(userInfo.openId);

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to the origin from state to ensure cookie is used correctly
      const { origin: redirectOrigin, returnPath } = parseState(state);
      const fallbackOrigin = redirectOrigin || (req.protocol + '://' + req.get('host'));
      res.redirect(302, fallbackOrigin + (returnPath ?? '/'));
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
