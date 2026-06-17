import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import type { Env } from "../env";

/// Per-request Prisma client over the D1 binding. Workers have no long-lived
/// process, so we create a client per request (cheap; the adapter wraps env.DB).
export function getPrisma(env: Env): PrismaClient {
  const adapter = new PrismaD1(env.DB);
  return new PrismaClient({ adapter });
}
