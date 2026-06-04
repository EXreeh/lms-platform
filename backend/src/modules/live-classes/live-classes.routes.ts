import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { createLiveClassSchema } from "./live-classes.validation.js";
import * as liveClassesController from "./live-classes.controller.js";

export const liveClassesRoutes = Router();

liveClassesRoutes.use(authenticate);

liveClassesRoutes.get("/", asyncHandler(liveClassesController.list));
liveClassesRoutes.post(
  "/",
  authorize("ADMIN"),
  validateBody(createLiveClassSchema),
  asyncHandler(liveClassesController.create),
);
