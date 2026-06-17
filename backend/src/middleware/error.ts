import type { Context } from "hono";
import type { HonoEnv } from "../env";

/// Mirrors the old Express error handler: controllers throw
/// `Object.assign(new Error("msg"), { status })`; we map that to a JSON body
/// `{ message }` with the right status. Unknown errors become 500.
export function onError(err: Error, c: Context<HonoEnv>): Response {
  const status = (err as Error & { status?: number }).status ?? 500;
  if (status >= 500) {
    console.error("Unhandled error:", err);
  }
  return c.json({ message: err.message || "Internal server error" }, status as 400);
}

/// Helper so route code reads like the old controllers.
export function httpError(message: string, status: number): Error {
  return Object.assign(new Error(message), { status });
}
