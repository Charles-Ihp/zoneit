import "reflect-metadata";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import passport from "passport";
import jwt from "jsonwebtoken";
import swaggerUi from "swagger-ui-express";
import { ValidateError } from "tsoa";
import { RegisterRoutes } from "./generated/routes";
import { configurePassport } from "./lib/passport";
import { prisma } from "./lib/prisma";
import type { User } from "@prisma/client";

configurePassport();

export const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = (process.env.FRONTEND_URL || "http://localhost:5173")
        .split(",")
        .map((u) => u.trim())
        .concat(["http://localhost:8080", "http://localhost:5173"]);
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(passport.initialize());

// ─── Health check ───────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// ─── Auth config + testing mode ─────────────────────────────────────────────

app.get("/api/auth/config", async (_req: Request, res: Response) => {
  const row = await prisma.appConfig.findUnique({ where: { key: "testingMode" } });
  const testingMode = row?.value === "true";
  res.json({ testingMode });
});

app.post("/api/auth/verify-code", async (req: Request, res: Response) => {
  const modeRow = await prisma.appConfig.findUnique({ where: { key: "testingMode" } });
  if (modeRow?.value !== "true") return res.json({ valid: true });

  const { code } = req.body as { code?: string };
  if (typeof code !== "string" || code.trim().length === 0) return res.json({ valid: false });

  const promo = await prisma.promoCode.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!promo) return res.json({ valid: false });

  // Mark as used (first use only — allows re-use if already used by same device)
  if (!promo.usedAt) {
    await prisma.promoCode.update({
      where: { code: promo.code },
      data: { usedAt: new Date() },
    });
  }
  res.json({ valid: true });
});

// ─── Google OAuth ────────────────────────────────────────────────────────────

app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}?error=auth_failed`,
  }),
  (req: Request, res: Response) => {
    const user = req.user as User;
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}?token=${encodeURIComponent(token)}`);
  },
);

// ─── TSOA-generated routes ───────────────────────────────────────────────────

RegisterRoutes(app);

// ─── Swagger UI ──────────────────────────────────────────────────────────────

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const swaggerDocument = require("../public/swagger.json") as object;
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch {
  // swagger.json not generated yet — run `npm run tsoa` first
}

// ─── Error handler ───────────────────────────────────────────────────────────

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ValidateError) {
    res.status(422).json({ message: "Validation Failed", details: err.fields });
    return;
  }

  if (err instanceof Error) {
    const status = (err as Error & { status?: number }).status;
    if (status) {
      res.status(status).json({ message: err.message });
      return;
    }
  }

  console.error(err);
  res.status(500).json({ message: "Internal Server Error" });
});
