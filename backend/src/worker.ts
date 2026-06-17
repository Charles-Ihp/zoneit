import app from "./app";
import type { Env } from "./env";

/// Combined Worker entry: API + SPA from one origin.
/// - `/api/*` and `/health` are handled by the Hono app.
/// - everything else is served from the static SPA assets (env.ASSETS). The
///   `not_found_handling: "single-page-application"` setting in wrangler.jsonc
///   makes deep links (e.g. /leaderboard) fall back to index.html.
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health" || url.pathname.startsWith("/api/")) {
      return app.fetch(request, env, ctx);
    }
    return env.ASSETS.fetch(request);
  },
};
