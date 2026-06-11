import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { uploadRateLimiter } from "../../middleware/rate-limit.js";
import {
  uploadVideoMiddleware,
  uploadResourceMiddleware,
  uploadThumbnailMiddleware,
  validateUploadedFileMiddleware,
  handleMulterErrorForCategory,
} from "./uploads.middleware.js";
import * as uploadsController from "./uploads.controller.js";

export const uploadsRoutes = Router();

uploadsRoutes.use(authenticate, uploadRateLimiter);

function withUpload(
  middleware: (req: Request, res: Response, cb: (err?: unknown) => void) => void,
  category: "video" | "resource" | "thumbnail",
  handler: (req: Request, res: Response) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, (err) => {
      if (err) {
        handleMulterErrorForCategory(category)(err, req, res, next);
        return;
      }
      validateUploadedFileMiddleware(category)(req, res, (validateErr) => {
        if (validateErr) {
          next(validateErr);
          return;
        }
        void handler(req, res).catch(next);
      });
    });
  };
}

uploadsRoutes.post("/video", withUpload(uploadVideoMiddleware, "video", uploadsController.uploadVideo));
uploadsRoutes.post(
  "/resource",
  withUpload(uploadResourceMiddleware, "resource", uploadsController.uploadResource),
);
uploadsRoutes.post(
  "/thumbnail",
  withUpload(uploadThumbnailMiddleware, "thumbnail", uploadsController.uploadThumbnail),
);

uploadsRoutes.delete("/:category/:filename", asyncHandler(uploadsController.deleteUploadedFile));
