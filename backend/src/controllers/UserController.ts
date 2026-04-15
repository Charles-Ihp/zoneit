import { Body, Controller, Get, Patch, Request, Route, Security, Tags } from "tsoa";
import type { Request as ExpressRequest } from "express";
import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma";
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
    createdAt: user.createdAt.toISOString(),
  };
}

@Route("api/users")
@Tags("Users")
@Security("bearerAuth")
export class UserController extends Controller {
  /**
   * Returns the authenticated user's profile.
   */
  @Get("me")
  public async getMe(@Request() request: ExpressRequest): Promise<UserResponse> {
    const user = (request as ExpressRequest & { user: User }).user;
    return toResponse(user);
  }

  /**
   * Update the authenticated user's profile.
   */
  @Patch("me")
  public async updateMe(
    @Request() request: ExpressRequest,
    @Body() body: UpdateProfileBody,
  ): Promise<UserResponse> {
    const user = (request as ExpressRequest & { user: User }).user;
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.age !== undefined ? { age: body.age } : {}),
        ...(body.weightKg !== undefined ? { weightKg: body.weightKg } : {}),
        ...(body.heightCm !== undefined ? { heightCm: body.heightCm } : {}),
      },
    });
    return toResponse(updated);
  }
}
