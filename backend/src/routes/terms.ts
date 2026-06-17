import { Hono } from "hono";
import type { HonoEnv } from "../env";
import { getPrisma } from "../lib/prisma";

export const termRoutes = new Hono<HonoEnv>();

// GET /api/terms?q=
// Note: SQLite `contains` (LIKE) is already case-insensitive for ASCII, so the
// old Postgres `mode: "insensitive"` is dropped (it's unsupported on SQLite).
termRoutes.get("/", async (c) => {
  const q = c.req.query("q");
  const prisma = getPrisma(c.env);
  const terms = await prisma.term.findMany({
    where: q
      ? { OR: [{ term: { contains: q } }, { definition: { contains: q } }] }
      : undefined,
    orderBy: [{ letter: "asc" }, { term: "asc" }],
  });
  return c.json(
    terms.map((t) => ({
      id: t.id,
      term: t.term,
      definition: t.definition,
      letter: t.letter,
    })),
  );
});
