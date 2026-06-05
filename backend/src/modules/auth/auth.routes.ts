import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { optionalAuthenticate } from "../../middleware/optional-authenticate.js";
import { validateBody } from "../../middleware/validate.js";
import { validateQuery } from "../../middleware/validate-query.js";
import {
  otpRateLimiter,
  checkEmailRateLimiter,
  loginRateLimiter,
} from "../../middleware/rate-limit.js";
import {
  loginSchema,
  checkEmailSchema,
  registerRequestOtpSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "./auth.validation.js";
import * as authController from "./auth.controller.js";

export const authRoutes = Router();

authRoutes.get(
  "/check-email",
  checkEmailRateLimiter,
  validateQuery(checkEmailSchema),
  asyncHandler(authController.checkEmail),
);

authRoutes.post(
  "/register/request-otp",
  otpRateLimiter,
  validateBody(registerRequestOtpSchema),
  asyncHandler(authController.registerRequestOtp),
);

authRoutes.post(
  "/register/resend-otp",
  otpRateLimiter,
  validateBody(resendOtpSchema),
  asyncHandler(authController.registerResendOtp),
);

authRoutes.post(
  "/register/verify",
  otpRateLimiter,
  validateBody(verifyOtpSchema),
  asyncHandler(authController.registerVerifyOtp),
);

authRoutes.post(
  "/login",
  loginRateLimiter,
  validateBody(loginSchema),
  asyncHandler(authController.login),
);

authRoutes.post("/logout", optionalAuthenticate, asyncHandler(authController.logout));

authRoutes.get("/me", authenticate, asyncHandler(authController.me));

authRoutes.get("/account", authenticate, asyncHandler(authController.account));

authRoutes.patch(
  "/profile",
  authenticate,
  validateBody(updateProfileSchema),
  asyncHandler(authController.updateProfile),
);

authRoutes.post(
  "/password/change",
  authenticate,
  validateBody(changePasswordSchema),
  asyncHandler(authController.changePassword),
);

authRoutes.post(
  "/password/forgot",
  otpRateLimiter,
  validateBody(forgotPasswordSchema),
  asyncHandler(authController.forgotPasswordRequest),
);

authRoutes.post(
  "/password/resend-otp",
  otpRateLimiter,
  validateBody(resendOtpSchema),
  asyncHandler(authController.forgotPasswordResend),
);

authRoutes.post(
  "/password/verify-otp",
  otpRateLimiter,
  validateBody(verifyOtpSchema),
  asyncHandler(authController.forgotPasswordVerify),
);

authRoutes.post(
  "/password/reset",
  otpRateLimiter,
  validateBody(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);
