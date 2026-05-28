import { Body, Controller, Post, Route, Tags } from "tsoa";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import type { RegisterBody, LoginBody, AuthResponse } from "../models/Auth";

const SALT_ROUNDS = 10;

@Route("api/auth")
@Tags("Auth")
export class AuthController extends Controller {
  /**
   * Register a new user with email and password.
   */
  @Post("register")
  public async register(@Body() body: RegisterBody): Promise<AuthResponse> {
    const { email, password, name } = body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      this.setStatus(409);
      throw Object.assign(new Error("User with this email already exists"), { status: 409 });
    }

    // Validate password strength
    if (password.length < 6) {
      this.setStatus(400);
      throw Object.assign(new Error("Password must be at least 6 characters"), { status: 400 });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
      },
    });

    // Generate JWT token
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    };
  }

  /**
   * Login with email and password.
   */
  @Post("login")
  public async login(@Body() body: LoginBody): Promise<AuthResponse> {
    const { email, password } = body;

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.setStatus(401);
      throw Object.assign(new Error("Invalid email or password"), { status: 401 });
    }

    // Check if user has a password (might be Google-only user)
    if (!user.passwordHash) {
      this.setStatus(401);
      throw Object.assign(
        new Error("This account uses Google login. Please sign in with Google."),
        { status: 401 },
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      this.setStatus(401);
      throw Object.assign(new Error("Invalid email or password"), { status: 401 });
    }

    // Generate JWT token
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    };
  }
}
