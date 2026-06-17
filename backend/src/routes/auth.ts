import { Hono } from "hono";
import type { HonoEnv } from "../env";
import { getPrisma } from "../lib/prisma";
import { httpError } from "../middleware/error";
import {
  hashPassword,
  comparePassword,
  signJwt,
  getGoogleAuthUrl,
  exchangeGoogleCode,
} from "../lib/auth";
import type { RegisterBody, LoginBody, AuthResponse } from "../models/Auth";

export const authRoutes = new Hono<HonoEnv>();

// POST /api/auth/register
authRoutes.post("/register", async (c) => {
  const { email, password, name } = await c.req.json<RegisterBody>();
  const prisma = getPrisma(c.env);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw httpError("User with this email already exists", 409);
  }
  if (!password || password.length < 6) {
    throw httpError("Password must be at least 6 characters", 400);
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, name, passwordHash } });
  const token = await signJwt(user.id, c.env.JWT_SECRET);

  const body: AuthResponse = {
    token,
    user: { id: user.id, email: user.email, name: user.name, picture: user.picture },
  };
  return c.json(body);
});

// POST /api/auth/login
authRoutes.post("/login", async (c) => {
  const { email, password } = await c.req.json<LoginBody>();
  const prisma = getPrisma(c.env);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw httpError("Invalid email or password", 401);
  }
  if (!user.passwordHash) {
    throw httpError("This account uses Google login. Please sign in with Google.", 401);
  }
  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    throw httpError("Invalid email or password", 401);
  }

  const token = await signJwt(user.id, c.env.JWT_SECRET);
  const body: AuthResponse = {
    token,
    user: { id: user.id, email: user.email, name: user.name, picture: user.picture },
  };
  return c.json(body);
});

// GET /api/auth/config — testing-mode flag (preserved from the old Express app).
authRoutes.get("/config", (c) => c.json({ testingMode: false }));

// GET /api/auth/google — redirect to Google's consent screen.
authRoutes.get("/google", (c) => c.redirect(getGoogleAuthUrl(c.env)));

// GET /api/auth/google/callback — exchange code, upsert user, redirect with token.
authRoutes.get("/google/callback", async (c) => {
  const code = c.req.query("code");
  // Combined Worker → the SPA is the same origin as this request. Derive the
  // redirect target from the request URL so it works on any domain without a
  // hardcoded FRONTEND_URL (env var kept only as an explicit override).
  const frontendUrl = c.env.FRONTEND_URL || new URL(c.req.url).origin;
  if (!code) {
    return c.redirect(`${frontendUrl}?error=auth_failed`);
  }

  try {
    const profile = await exchangeGoogleCode(c.env, code);
    const prisma = getPrisma(c.env);
    const user = await prisma.user.upsert({
      where: { googleId: profile.id },
      update: { name: profile.name, picture: profile.picture },
      create: {
        googleId: profile.id,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
      },
    });
    const token = await signJwt(user.id, c.env.JWT_SECRET);
    return c.redirect(`${frontendUrl}?token=${encodeURIComponent(token)}`);
  } catch {
    return c.redirect(`${frontendUrl}?error=auth_failed`);
  }
});
