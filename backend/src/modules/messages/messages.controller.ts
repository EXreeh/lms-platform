import type { Request, Response } from "express";
import { ApiError } from "../../utils/api-error.js";
import * as messagesService from "./messages.service.js";
import { inboxQuerySchema, sendMessageSchema } from "./messages.validation.js";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export async function composeTargets(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await messagesService.getComposeTargets(user.id, user.role);
  res.json({ success: true, data });
}

export async function send(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const body = sendMessageSchema.parse(req.body);
  const data = await messagesService.sendMessage({
    senderId: user.id,
    senderRole: user.role,
    recipientIds: body.recipientIds,
    batchId: body.batchId,
    broadcastAllStudents: body.broadcastAllStudents,
    subject: body.subject,
    content: body.content,
    type: body.type,
  });
  res.status(201).json({ success: true, data });
}

export async function inbox(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const query = inboxQuerySchema.parse(req.query);
  const data = await messagesService.getInbox(user.id, {
    unreadOnly: query.unreadOnly === "true",
  });
  res.json({ success: true, data });
}

export async function sent(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await messagesService.getSent(user.id);
  res.json({ success: true, data });
}

export async function unreadCount(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const started = Date.now();
  console.log("[API] GET /api/messages/unread-count hit");
  const count = await messagesService.getUnreadCount(user.id);
  console.log(`[API] GET /api/messages/unread-count ok — ${Date.now() - started}ms count=${count}`);
  res.json({ success: true, data: { count, unreadCount: count } });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await messagesService.getMessageById(req.params.messageId, user.id);
  res.json({ success: true, data });
}

export async function markRead(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await messagesService.markRead(req.params.messageId, user.id);
  res.json({ success: true, data });
}
