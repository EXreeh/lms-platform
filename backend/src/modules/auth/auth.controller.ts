import type { Request, Response } from "express";
import * as authService from "./auth.service.js";
import { ApiError } from "../../utils/api-error.js";
import { setAuthCookie, clearAuthCookie } from "../../utils/auth-cookie.js";
import { logAuthEvent } from "../../utils/auth-log.js";
import type {
  LoginInput,
  RegisterRequestOtpInput,
  VerifyOtpInput,
} from "./auth.validation.js";

export async function checkEmail(req: Request, res: Response): Promise<void> {
  const { email } = req.query as unknown as { email: string };
  const result = await authService.checkEmailAvailability(email);

  res.json({ success: true, data: result });
}

export async function registerRequestOtp(req: Request, _res: Response): Promise<void> {
  const input = req.body as RegisterRequestOtpInput;
  logAuthEvent("register:blocked", { email: input.email });
  await authService.requestRegistrationOtp(input);
}

export async function registerResendOtp(req: Request, _res: Response): Promise<void> {
  await authService.resendRegistrationOtp((req.body as { email: string }).email);
}

export async function registerVerifyOtp(req: Request, _res: Response): Promise<void> {
  await authService.verifyRegistrationOtp(req.body as VerifyOtpInput);
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = req.body as LoginInput;
  const result = await authService.login(input);

  setAuthCookie(res, result.token);
  logAuthEvent("login:success", {
    userId: result.user.id,
    role: result.user.role,
  });

  res.json({
    success: true,
    message: "Login successful",
    data: result,
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  logAuthEvent("logout:success", {
    userId: req.user?.id ?? null,
    role: req.user?.role ?? null,
  });
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
  logAuthEvent("me:success", {
    userId: user.id,
    role: user.role,
  });

  res.json({
    success: true,
    data: { user },
  });
}

export async function account(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const data = await authService.getAccountProfile(req.user.id);
  res.json({ success: true, data });
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const input = req.body as import("./auth.validation.js").UpdateProfileInput;
  const data = await authService.updateProfile(req.user.id, input);
  logAuthEvent("profile:success", { userId: req.user.id });

  res.json({ success: true, data });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const { currentPassword, newPassword } = req.body as import("./auth.validation.js").ChangePasswordInput;
  const result = await authService.changePassword(req.user.id, { currentPassword, newPassword });
  res.json({ success: true, ...result });
}

export async function forgotPasswordRequest(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email: string };
  logAuthEvent("password-reset:request", { email });
  const result = await authService.requestPasswordResetOtp(email);

  res.json({ success: true, ...result });
}

export async function forgotPasswordResend(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email: string };
  const result = await authService.resendPasswordResetOtp(email);

  res.json({ success: true, ...result });
}

export async function forgotPasswordVerify(req: Request, res: Response): Promise<void> {
  const input = req.body as VerifyOtpInput;
  const result = await authService.verifyPasswordResetOtp(input);

  res.json({ success: true, data: result });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { resetToken, password } = req.body as { resetToken: string; password: string };
  const result = await authService.resetPassword(resetToken, password);

  res.json({ success: true, ...result });
}
