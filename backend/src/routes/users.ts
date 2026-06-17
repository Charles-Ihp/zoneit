import { Hono } from "hono";
import type { User } from "@prisma/client";
import type { HonoEnv } from "../env";
import { getPrisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import type { UserResponse, UpdateProfileBody } from "../models/User";

function toResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture ?? null,
    age: user.age ?? null,
    weightKg: user.weightKg ?? null,
    heightCm: user.heightCm ?? null,
    restTimeSeconds: user.restTimeSeconds ?? 90,
    isVip: user.isVip,
    createdAt: user.createdAt.toISOString(),
  };
}

export const userRoutes = new Hono<HonoEnv>();
userRoutes.use("*", requireAuth);

// GET /api/users/me
userRoutes.get("/me", (c) => c.json(toResponse(c.get("user"))));

// PATCH /api/users/me
userRoutes.patch("/me", async (c) => {
  const user = c.get("user");
  const body = await c.req.json<UpdateProfileBody>();
  const prisma = getPrisma(c.env);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.age !== undefined ? { age: body.age } : {}),
      ...(body.weightKg !== undefined ? { weightKg: body.weightKg } : {}),
      ...(body.heightCm !== undefined ? { heightCm: body.heightCm } : {}),
      ...(body.restTimeSeconds !== undefined ? { restTimeSeconds: body.restTimeSeconds } : {}),
    },
  });
  return c.json(toResponse(updated));
});
