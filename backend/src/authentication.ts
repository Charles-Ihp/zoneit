import { Request } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "./lib/prisma";

interface JwtPayload {
  sub: string;
}

/**
 * TSOA authentication handler.
 * Called for every route decorated with @Security('bearerAuth').
 * Attaches the resolved user to request.user for use in controllers.
 */
export async function expressAuthentication(
  request: Request,
  securityName: string,
  _scopes?: string[],
): Promise<unknown> {
  if (securityName !== "bearerAuth") {
    throw Object.assign(new Error("Unknown security scheme"), { status: 401 });
  }

  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw Object.assign(new Error("Missing or invalid Authorization header"), { status: 401 });
  }

  const token = authHeader.slice(7);
  let payload: JwtPayload;

  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  } catch {
    throw Object.assign(new Error("Invalid or expired token"), { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 401 });
  }

  // Attach to request so controllers can read it
  (request as Request & { user: typeof user }).user = user;
  return user;
}
