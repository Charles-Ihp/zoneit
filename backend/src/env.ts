/// Cloudflare Worker bindings & secrets, injected as the Hono `Bindings`.
/// `DB` is the D1 database; `ASSETS` serves the built SPA (combined Worker).
export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  JWT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
  /// Optional override for the post-OAuth redirect target. Unset by default —
  /// derived from the request origin (same-origin combined Worker).
  FRONTEND_URL?: string;
  /// Optional override for the share-link base URL. Unset by default — derived
  /// from the request origin.
  APP_URL?: string;
}

import type { User } from "@prisma/client";

/// Hono generic env: bindings + per-request variables (the authed user).
export type HonoEnv = {
  Bindings: Env;
  Variables: { user: User };
};
