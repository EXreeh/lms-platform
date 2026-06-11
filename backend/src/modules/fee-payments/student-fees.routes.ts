import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { feePaymentOrderRateLimiter, feePaymentVerifyRateLimiter } from "../../middleware/rate-limit.js";
import { createOrderSchema, verifyPaymentSchema } from "./fee-payments.validation.js";
import * as studentFeesController from "./student-fees.controller.js";

export const studentFeesRoutes = Router();
export const studentFeePaymentsRoutes = Router();

studentFeesRoutes.use(authenticate, authorize("STUDENT"));
studentFeesRoutes.get("/", asyncHandler(studentFeesController.listFees));
studentFeesRoutes.get("/:feePlanId", asyncHandler(studentFeesController.getFee));
studentFeesRoutes.post(
  "/:feePlanId/create-order",
  feePaymentOrderRateLimiter,
  validateBody(createOrderSchema),
  asyncHandler(studentFeesController.createOrder),
);

studentFeePaymentsRoutes.use(authenticate, authorize("STUDENT"));
studentFeePaymentsRoutes.post(
  "/verify",
  feePaymentVerifyRateLimiter,
  validateBody(verifyPaymentSchema),
  asyncHandler(studentFeesController.verifyPayment),
);
studentFeePaymentsRoutes.get("/", asyncHandler(studentFeesController.listPayments));
studentFeePaymentsRoutes.get(
  "/:paymentId/receipt",
  asyncHandler(studentFeesController.getReceipt),
);
