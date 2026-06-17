import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { Env } from "../env";
import { httpError } from "../middleware/error";

const SALT_ROUNDS = 10;
const encoder = new TextEncoder();

// ─── Passwords ───────────────────────────────────────────────────────────────
// bcryptjs is pure-JS (runs on Workers) and verifies the existing native-bcrypt
// `$2b$` hashes, so no password resets are needed after the migration.

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT (jose) ──────────────────────────────────────────────────────────────
// HS256 + `{ sub }` payload + 7-day expiry — identical to the old jsonwebtoken
// signing, so tokens issued before the migration keep verifying.

export async function signJwt(sub: string, secret: string): Promise<string> {
  return new SignJWT({ sub })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encoder.encode(secret));
}

export async function verifyJwt(token: string, secret: string): Promise<{ sub: string }> {
  const { payload } = await jwtVerify(token, encoder.encode(secret));
  if (typeof payload.sub !== "string") {
    throw httpError("Invalid token payload", 401);
  }
  return { sub: payload.sub };
}

// ─── Google OAuth (hand-rolled code flow; replaces passport) ──────────────────

export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

/// Step 1: the consent URL we redirect the browser to.
export function getGoogleAuthUrl(env: Env): string {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_CALLBACK_URL,
    response_type: "code",
    scope: "profile email",
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/// Step 2: exchange the auth code for an access token, then fetch the profile.
export async function exchangeGoogleCode(env: Env, code: string): Promise<GoogleProfile> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      grant_type: "authorization_code",
    }).toString(),
  });
  if (!tokenRes.ok) {
    throw httpError("Google token exchange failed", 401);
  }
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) {
    throw httpError("Google token exchange returned no access token", 401);
  }

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!profileRes.ok) {
    throw httpError("Failed to fetch Google profile", 401);
  }
  return (await profileRes.json()) as GoogleProfile;
}
