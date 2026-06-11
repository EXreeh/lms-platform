import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorizeAdmin } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { createFeePlanSchema } from "../fees/fees.validation.js";
import { offlinePaymentSchema, updateFeePlanSchema } from "./fee-payments.validation.js";
import * as adminFeePaymentsController from "./admin-fee-payments.controller.js";

export const adminFeesRoutes = Router();
export const adminFeePaymentsRoutes = Router();

adminFeesRoutes.use(authenticate, authorizeAdmin());
adminFeesRoutes.get("/", asyncHandler(adminFeePaymentsController.listFees));
adminFeesRoutes.post(
  "/",
  validateBody(createFeePlanSchema),
  asyncHandler(adminFeePaymentsController.createFee),
);
adminFeesRoutes.patch(
  "/:id",
  validateBody(updateFeePlanSchema),
  asyncHandler(adminFeePaymentsController.updateFee),
);
adminFeesRoutes.delete("/:id", asyncHandler(adminFeePaymentsController.cancelFee));

adminFeePaymentsRoutes.use(authenticate, authorizeAdmin());
adminFeePaymentsRoutes.get("/", asyncHandler(adminFeePaymentsController.listPayments));
adminFeePaymentsRoutes.get("/stats", asyncHandler(adminFeePaymentsController.paymentStats));
adminFeePaymentsRoutes.post(
  "/offline",
  validateBody(offlinePaymentSchema),
  asyncHandler(adminFeePaymentsController.recordOffline),
);
adminFeePaymentsRoutes.get(
  "/:paymentId/receipt",
  asyncHandler(adminFeePaymentsController.getReceipt),
);
