import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import * as certificatesController from "./certificates.controller.js";

export const certificatesRoutes = Router();

certificatesRoutes.get("/verify/:code", asyncHandler(certificatesController.verify));

certificatesRoutes.use(authenticate);

certificatesRoutes.get(
  "/mine",
  authorize("STUDENT"),
  asyncHandler(certificatesController.listMine),
);

certificatesRoutes.get(
  "/eligibility/:courseId",
  authorize("STUDENT"),
  asyncHandler(certificatesController.eligibility),
);

certificatesRoutes.post(
  "/generate/:courseId",
  authorize("STUDENT"),
  asyncHandler(certificatesController.generate),
);

certificatesRoutes.get(
  "/course/:courseId",
  authorize("STUDENT"),
  asyncHandler(certificatesController.getByCourse),
);

certificatesRoutes.get(
  "/:certificateId/download",
  authorize("STUDENT", "ADMIN"),
  asyncHandler(certificatesController.download),
);

certificatesRoutes.get(
  "/:certificateId",
  authorize("STUDENT"),
  asyncHandler(certificatesController.getOne),
);
