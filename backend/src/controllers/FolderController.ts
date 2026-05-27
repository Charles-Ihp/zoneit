import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Request,
  Route,
  Security,
  Tags,
  SuccessResponse,
} from "tsoa";
import type { Request as ExpressRequest } from "express";
import type { User, Folder } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type {
  FolderResponse,
  CreateFolderBody,
  UpdateFolderBody,
  ReorderFoldersBody,
} from "../models/Folder";

@Route("api/folders")
@Tags("Folders")
@Security("bearerAuth")
export class FolderController extends Controller {
  /**
   * List all folders for the authenticated user, ordered by position.
   */
  @Get("/")
  public async listFolders(@Request() request: ExpressRequest): Promise<FolderResponse[]> {
    const user = (request as ExpressRequest & { user: User }).user;
    const folders = await prisma.folder.findMany({
      where: { userId: user.id },
      orderBy: { order: "asc" },
    });
    return folders.map(toResponse);
  }

  /**
   * Create a new folder.
   */
  @Post("/")
  @SuccessResponse(201, "Created")
  public async createFolder(
    @Request() request: ExpressRequest,
    @Body() body: CreateFolderBody,
  ): Promise<FolderResponse> {
    const user = (request as ExpressRequest & { user: User }).user;

    // Get the highest order value to put new folder at the end
    const lastFolder = await prisma.folder.findFirst({
      where: { userId: user.id },
      orderBy: { order: "desc" },
    });
    const nextOrder = lastFolder ? lastFolder.order + 1 : 0;

    const folder = await prisma.folder.create({
      data: {
        name: body.name,
        userId: user.id,
        order: nextOrder,
      },
    });
    this.setStatus(201);
    return toResponse(folder);
  }

  /**
   * Get a single folder by ID.
   */
  @Get("{id}")
  public async getFolder(
    @Request() request: ExpressRequest,
    @Path() id: string,
  ): Promise<FolderResponse> {
    const user = (request as ExpressRequest & { user: User }).user;
    const folder = await prisma.folder.findFirst({ where: { id, userId: user.id } });
    if (!folder) {
      this.setStatus(404);
      throw Object.assign(new Error("Folder not found"), { status: 404 });
    }
    return toResponse(folder);
  }

  /**
   * Update a folder (rename).
   */
  @Put("{id}")
  public async updateFolder(
    @Request() request: ExpressRequest,
    @Path() id: string,
    @Body() body: UpdateFolderBody,
  ): Promise<FolderResponse> {
    const user = (request as ExpressRequest & { user: User }).user;
    const existing = await prisma.folder.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      this.setStatus(404);
      throw Object.assign(new Error("Folder not found"), { status: 404 });
    }
    const folder = await prisma.folder.update({
      where: { id },
      data: { name: body.name },
    });
    return toResponse(folder);
  }

  /**
   * Reorder folders by providing the new order of folder IDs.
   */
  @Put("/")
  public async reorderFolders(
    @Request() request: ExpressRequest,
    @Body() body: ReorderFoldersBody,
  ): Promise<FolderResponse[]> {
    const user = (request as ExpressRequest & { user: User }).user;

    // Verify all folders belong to the user
    const folders = await prisma.folder.findMany({
      where: { userId: user.id },
    });
    const userFolderIds = new Set(folders.map((f) => f.id));
    for (const folderId of body.folderIds) {
      if (!userFolderIds.has(folderId)) {
        this.setStatus(400);
        throw Object.assign(new Error("Invalid folder ID"), { status: 400 });
      }
    }

    // Update order for each folder
    await prisma.$transaction(
      body.folderIds.map((folderId, index) =>
        prisma.folder.update({
          where: { id: folderId },
          data: { order: index },
        }),
      ),
    );

    // Return updated folders
    const updatedFolders = await prisma.folder.findMany({
      where: { userId: user.id },
      orderBy: { order: "asc" },
    });
    return updatedFolders.map(toResponse);
  }

  /**
   * Delete a folder. Workouts in this folder will be moved to root (no folder).
   */
  @Delete("{id}")
  @SuccessResponse(204, "No Content")
  public async deleteFolder(@Request() request: ExpressRequest, @Path() id: string): Promise<void> {
    const user = (request as ExpressRequest & { user: User }).user;
    const existing = await prisma.folder.findFirst({ where: { id, userId: user.id } });
    if (!existing) {
      this.setStatus(404);
      throw Object.assign(new Error("Folder not found"), { status: 404 });
    }

    // Move workouts to root before deleting folder
    await prisma.workout.updateMany({
      where: { folderId: id },
      data: { folderId: null },
    });

    await prisma.folder.delete({ where: { id } });
    this.setStatus(204);
  }
}

function toResponse(f: Folder): FolderResponse {
  return {
    id: f.id,
    name: f.name,
    order: f.order,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  };
}
