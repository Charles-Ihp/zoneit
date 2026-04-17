import { Controller, Get, Query, Route, Tags } from "tsoa";
import { prisma } from "../lib/prisma";
import type { TermResponse } from "../models/Term";

@Route("api/terms")
@Tags("Terms")
export class TermController extends Controller {
  /**
   * List all bouldering glossary terms, optionally filtered by a search query.
   */
  @Get("/")
  public async listTerms(@Query() q?: string): Promise<TermResponse[]> {
    const terms = await prisma.term.findMany({
      where: q
        ? {
            OR: [
              { term: { contains: q, mode: "insensitive" } },
              { definition: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: [{ letter: "asc" }, { term: "asc" }],
    });
    return terms.map((t) => ({
      id: t.id,
      term: t.term,
      definition: t.definition,
      letter: t.letter,
    }));
  }
}
