import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import {
  addFeePaymentSchema,
  createFeePlanSchema,
  sendFeeReminderSchema,
} from "./fees.validation.js";
import * as feesController from "./fees.controller.js";

export const feesRoutes = Router();

feesRoutes.use(authenticate);

feesRoutes.get("/me", authorize("STUDENT"), asyncHandler(feesController.studentDashboard));
feesRoutes.get(
  "/student-access/:studentId",
  authorize("TEACHER", "ADMIN"),
  asyncHandler(feesController.studentAccess),
);

feesRoutes.get(
  "/analytics",
  authorize("ADMIN"),
  asyncHandler(feesController.analytics),
);
feesRoutes.get("/", authorize("ADMIN"), asyncHandler(feesController.listAdmin));
feesRoutes.post(
  "/",
  authorize("ADMIN"),
  validateBody(createFeePlanSchema),
  asyncHandler(feesController.create),
);
feesRoutes.get("/:feePlanId", authorize("ADMIN"), asyncHandler(feesController.getOne));
feesRoutes.post(
  "/:feePlanId/payments",
  authorize("ADMIN"),
  validateBody(addFeePaymentSchema),
  asyncHandler(feesController.addPayment),
);
feesRoutes.post(
  "/:feePlanId/reminders",
  authorize("ADMIN"),
  validateBody(sendFeeReminderSchema),
  asyncHandler(feesController.sendReminder),
);
