import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import type { User } from "@prisma/client";
import type { HonoEnv } from "../env";
import { getPrisma } from "../lib/prisma";
import { verifyJwt } from "../lib/auth";
import { httpError } from "./error";

/// Shared logic for both schemes: verify the Bearer JWT, load the user, and
/// attach it to the context (mirrors the old TSOA expressAuthentication).
async function authenticate(c: Context<HonoEnv>): Promise<User> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw httpError("Missing or invalid Authorization header", 401);
  }
  const token = authHeader.slice(7);

  let sub: string;
  try {
    ({ sub } = await verifyJwt(token, c.env.JWT_SECRET));
  } catch {
    throw httpError("Invalid or expired token", 401);
  }

  const prisma = getPrisma(c.env);
  const user = await prisma.user.findUnique({ where: { id: sub } });
  if (!user) {
    throw httpError("User not found", 401);
  }

  c.set("user", user);
  return user;
}

/// @Security("bearerAuth")
export const requireAuth = createMiddleware<HonoEnv>(async (c, next) => {
  await authenticate(c);
  await next();
});

/// @Security("vip") — authenticated AND VIP (403 otherwise).
export const requireVip = createMiddleware<HonoEnv>(async (c, next) => {
  const user = await authenticate(c);
  if (!user.isVip) {
    throw httpError("VIP access required", 403);
  }
  await next();
});
