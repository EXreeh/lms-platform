import type { Request, Response } from "express";
import * as authService from "./auth.service.js";
import { ApiError } from "../../utils/api-error.js";
import { setAuthCookie, clearAuthCookie } from "../../utils/auth-cookie.js";
import type { RegisterInput, LoginInput } from "./auth.validation.js";

export async function register(req: Request, res: Response): Promise<void> {
  const input = req.body as RegisterInput;
  const result = await authService.register(input);

  setAuthCookie(res, result.token);

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: {
      user: result.user,
      token: result.token,
    },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = req.body as LoginInput;
  const result = await authService.login(input);

  setAuthCookie(res, result.token);

  res.json({
    success: true,
    message: "Login successful",
    data: {
      user: result.user,
      token: result.token,
    },
  });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  clearAuthCookie(res);

  res.json({
    success: true,
    message: "Logged out successfully",
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const user = await authService.getProfile(req.user.id);

  res.json({
    success: true,
    data: { user },
  });
}
