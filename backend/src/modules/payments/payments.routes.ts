import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { createOrderSchema, verifyPaymentSchema } from "./payments.validation.js";
import * as paymentsController from "./payments.controller.js";

export const paymentsRoutes = Router();

paymentsRoutes.use(authenticate);

paymentsRoutes.post(
  "/orders",
  authorize("STUDENT"),
  validateBody(createOrderSchema),
  asyncHandler(paymentsController.createOrder),
);

paymentsRoutes.post(
  "/verify",
  authorize("STUDENT"),
  validateBody(verifyPaymentSchema),
  asyncHandler(paymentsController.verify),
);

paymentsRoutes.get(
  "/mine",
  authorize("STUDENT"),
  asyncHandler(paymentsController.listMine),
);

paymentsRoutes.get(
  "/config",
  authorize("STUDENT"),
  asyncHandler(paymentsController.getKey),
);

paymentsRoutes.get(
  "/admin/analytics",
  authorize("ADMIN"),
  asyncHandler(paymentsController.revenueAnalytics),
);

paymentsRoutes.get(
  "/admin/all",
  authorize("ADMIN"),
  asyncHandler(paymentsController.listAll),
);
