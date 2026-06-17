import { Hono } from "hono";
import type { Folder } from "@prisma/client";
import type { HonoEnv } from "../env";
import { getPrisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { httpError } from "../middleware/error";
import type {
  FolderResponse,
  CreateFolderBody,
  UpdateFolderBody,
  ReorderFoldersBody,
} from "../models/Folder";

function toResponse(f: Folder): FolderResponse {
  return {
    id: f.id,
    name: f.name,
    order: f.order,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  };
}

export const folderRoutes = new Hono<HonoEnv>();
folderRoutes.use("*", requireAuth);

// GET /api/folders
folderRoutes.get("/", async (c) => {
  const user = c.get("user");
  const prisma = getPrisma(c.env);
  const folders = await prisma.folder.findMany({
    where: { userId: user.id },
    orderBy: { order: "asc" },
  });
  return c.json(folders.map(toResponse));
});

// POST /api/folders
folderRoutes.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json<CreateFolderBody>();
  const prisma = getPrisma(c.env);

  const lastFolder = await prisma.folder.findFirst({
    where: { userId: user.id },
    orderBy: { order: "desc" },
  });
  const nextOrder = lastFolder ? lastFolder.order + 1 : 0;

  const folder = await prisma.folder.create({
    data: { name: body.name, userId: user.id, order: nextOrder },
  });
  return c.json(toResponse(folder), 201);
});

// PUT /api/folders — reorder (registered alongside /:id; static "/" wins).
folderRoutes.put("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json<ReorderFoldersBody>();
  const prisma = getPrisma(c.env);

  const folders = await prisma.folder.findMany({ where: { userId: user.id } });
  const userFolderIds = new Set(folders.map((f) => f.id));
  for (const folderId of body.folderIds) {
    if (!userFolderIds.has(folderId)) {
      throw httpError("Invalid folder ID", 400);
    }
  }

  // Array-form $transaction maps to a D1 batch (supported; interactive tx is not).
  await prisma.$transaction(
    body.folderIds.map((folderId, index) =>
      prisma.folder.update({ where: { id: folderId }, data: { order: index } }),
    ),
  );

  const updatedFolders = await prisma.folder.findMany({
    where: { userId: user.id },
    orderBy: { order: "asc" },
  });
  return c.json(updatedFolders.map(toResponse));
});

// GET /api/folders/:id
folderRoutes.get("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const prisma = getPrisma(c.env);
  const folder = await prisma.folder.findFirst({ where: { id, userId: user.id } });
  if (!folder) {
    throw httpError("Folder not found", 404);
  }
  return c.json(toResponse(folder));
});

// PUT /api/folders/:id — rename
folderRoutes.put("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const body = await c.req.json<UpdateFolderBody>();
  const prisma = getPrisma(c.env);

  const existing = await prisma.folder.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    throw httpError("Folder not found", 404);
  }
  const folder = await prisma.folder.update({ where: { id }, data: { name: body.name } });
  return c.json(toResponse(folder));
});

// DELETE /api/folders/:id — moves contained workouts to root first
folderRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const prisma = getPrisma(c.env);

  const existing = await prisma.folder.findFirst({ where: { id, userId: user.id } });
  if (!existing) {
    throw httpError("Folder not found", 404);
  }
  await prisma.workout.updateMany({ where: { folderId: id }, data: { folderId: null } });
  await prisma.folder.delete({ where: { id } });
  return c.body(null, 204);
});
