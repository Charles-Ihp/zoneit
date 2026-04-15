import { Controller, Get, Request, Route, Security, Tags } from "tsoa";
import type { Request as ExpressRequest } from "express";
import type { User } from "@prisma/client";
import type { UserResponse } from "../models/User";

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
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture ?? null,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
