import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import * as dashboardController from "../modules/dashboard/dashboard.controller.js";

export const dashboardRoutes = Router();

dashboardRoutes.use(authenticate);

dashboardRoutes.get(
  "/teacher",
  authorize("TEACHER", "ADMIN"),
  asyncHandler(dashboardController.teacher),
);

dashboardRoutes.get(
  "/admin",
  authorize("ADMIN"),
  asyncHandler(dashboardController.admin),
);

dashboardRoutes.get(
  "/student",
  authorize("STUDENT"),
  asyncHandler(dashboardController.student),
);
