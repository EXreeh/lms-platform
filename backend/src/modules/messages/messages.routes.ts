import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { validateBody } from "../../middleware/validate.js";
import { validateQuery } from "../../middleware/validate-query.js";
import { sendMessageSchema, inboxQuerySchema } from "./messages.validation.js";
import * as messagesController from "./messages.controller.js";

export const messagesRoutes = Router();

messagesRoutes.use(authenticate);

messagesRoutes.get("/unread-count", asyncHandler(messagesController.unreadCount));
messagesRoutes.get("/compose-targets", asyncHandler(messagesController.composeTargets));
messagesRoutes.get("/inbox", validateQuery(inboxQuerySchema), asyncHandler(messagesController.inbox));
messagesRoutes.get("/sent", asyncHandler(messagesController.sent));
messagesRoutes.get("/:messageId", asyncHandler(messagesController.getOne));
messagesRoutes.post("/", validateBody(sendMessageSchema), asyncHandler(messagesController.send));
messagesRoutes.patch("/:messageId/read", asyncHandler(messagesController.markRead));
