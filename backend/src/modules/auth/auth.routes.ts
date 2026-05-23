import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody } from "../../middleware/validate.js";
import { registerSchema, loginSchema } from "./auth.validation.js";
import * as authController from "./auth.controller.js";

export const authRoutes = Router();

authRoutes.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler(authController.register),
);

authRoutes.post("/login", validateBody(loginSchema), asyncHandler(authController.login));

authRoutes.post("/logout", authenticate, asyncHandler(authController.logout));

authRoutes.get("/me", authenticate, asyncHandler(authController.me));
