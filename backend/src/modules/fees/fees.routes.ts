import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize, authorizeAdmin } from "../../middleware/authorize.js";
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
  authorize("TEACHER", "ADMIN", "OWNER"),
  asyncHandler(feesController.studentAccess),
);

feesRoutes.get(
  "/analytics",
  authorizeAdmin(),
  asyncHandler(feesController.analytics),
);
feesRoutes.get("/", authorizeAdmin(), asyncHandler(feesController.listAdmin));
feesRoutes.post(
  "/",
  authorizeAdmin(),
  validateBody(createFeePlanSchema),
  asyncHandler(feesController.create),
);
feesRoutes.get("/:feePlanId", authorizeAdmin(), asyncHandler(feesController.getOne));
feesRoutes.post(
  "/:feePlanId/payments",
  authorizeAdmin(),
  validateBody(addFeePaymentSchema),
  asyncHandler(feesController.addPayment),
);
feesRoutes.post(
  "/:feePlanId/reminders",
  authorizeAdmin(),
  validateBody(sendFeeReminderSchema),
  asyncHandler(feesController.sendReminder),
);
