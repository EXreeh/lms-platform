import type { Request, Response } from "express";
import { ApiError } from "../../utils/api-error.js";
import { requireAdminUser } from "../../middleware/authorize.js";
import {
  changeRoleSchema,
  createAdminSchema,
  createStudentSchema,
  createTeacherSchema,
  listUsersQuerySchema,
  resetPasswordSchema,
  suspendUserSchema,
} from "../admin/admin.validation.js";
import * as ownerService from "./owner.service.js";

function requireOwner(req: Request) {
  requireAdminUser(req);
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  requireOwner(req);
  const query = listUsersQuerySchema.parse(req.query);
  const data = await ownerService.listAllUsers(query);
  res.json({ success: true, data });
}

export async function listAdmins(req: Request, res: Response): Promise<void> {
  requireOwner(req);
  const data = await ownerService.listAdmins();
  res.json({ success: true, data });
}

export async function createAdmin(req: Request, res: Response): Promise<void> {
  const owner = requireOwner(req);
  const body = createAdminSchema.parse(req.body);
  const data = await ownerService.createAdminAsOwner(owner.id, body);
  res.status(201).json({ success: true, data });
}

export async function createTeacher(req: Request, res: Response): Promise<void> {
  const owner = requireOwner(req);
  const body = createTeacherSchema.parse(req.body);
  const data = await ownerService.createUserAsOwner(owner.id, "TEACHER", body);
  res.status(201).json({ success: true, data });
}

export async function createStudent(req: Request, res: Response): Promise<void> {
  const owner = requireOwner(req);
  const body = createStudentSchema.parse(req.body);
  const data = await ownerService.createUserAsOwner(owner.id, "STUDENT", body);
  res.status(201).json({ success: true, data });
}

export async function changeRole(req: Request, res: Response): Promise<void> {
  const owner = requireOwner(req);
  const body = changeRoleSchema.parse(req.body);
  const data = await ownerService.ownerChangeRole(owner.id, req.params.userId, body);
  res.json({ success: true, data });
}

export async function suspendUser(req: Request, res: Response): Promise<void> {
  const owner = requireOwner(req);
  const body = suspendUserSchema.parse(req.body);
  const data = await ownerService.ownerSuspend(owner.id, req.params.userId, body);
  res.json({ success: true, data });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const owner = requireOwner(req);
  const body = resetPasswordSchema.parse(req.body);
  const data = await ownerService.ownerResetPassword(owner.id, req.params.userId, body);
  res.json({ success: true, data });
}

export async function auditLogs(req: Request, res: Response): Promise<void> {
  requireOwner(req);
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  const data = await ownerService.getAuditLogs({
    page,
    limit,
    action: typeof req.query.action === "string" ? req.query.action : undefined,
    actorId: typeof req.query.actorId === "string" ? req.query.actorId : undefined,
    entityType: typeof req.query.entityType === "string" ? req.query.entityType : undefined,
  });
  res.json({ success: true, data });
}

export async function loginHistory(req: Request, res: Response): Promise<void> {
  requireOwner(req);
  const data = await ownerService.getLoginHistory();
  res.json({ success: true, data });
}

export async function securitySettings(req: Request, res: Response): Promise<void> {
  requireOwner(req);
  const data = await ownerService.getSecuritySettings();
  res.json({ success: true, data });
}
