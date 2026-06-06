import type { Request, Response } from "express";
import { ApiError } from "../../utils/api-error.js";
import * as accessService from "./course-access.service.js";
import {
  assignBatchCourseSchema,
  assignStudentCourseSchema,
  accessListQuerySchema,
} from "./course-access.validation.js";

function requireAdmin(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.role !== "ADMIN") throw ApiError.forbidden("Admin access required");
  return req.user;
}

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export async function listAccess(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  const query = accessListQuerySchema.parse(req.query);
  const data = await accessService.listAllAccess(query);
  res.json({ success: true, data });
}

export async function assignStudent(req: Request, res: Response): Promise<void> {
  const admin = requireAdmin(req);
  const body = assignStudentCourseSchema.parse(req.body);
  const data = await accessService.assignCourseToStudent(admin.id, body);
  res.status(201).json({ success: true, data });
}

export async function assignBatch(req: Request, res: Response): Promise<void> {
  const admin = requireAdmin(req);
  const { courseId } = assignBatchCourseSchema.parse(req.body);
  const data = await accessService.assignCourseToBatch(admin.id, req.params.batchId, courseId);
  res.json({ success: true, data });
}

export async function revoke(req: Request, res: Response): Promise<void> {
  requireAdmin(req);
  const data = await accessService.revokeStudentAccess(
    req.params.studentId,
    req.params.courseId,
  );
  res.json({ success: true, data });
}

export async function grantLifetime(req: Request, res: Response): Promise<void> {
  const admin = requireAdmin(req);
  const data = await accessService.grantLifetimeAccess(
    admin.id,
    req.params.studentId,
    req.params.courseId,
  );
  res.json({ success: true, data });
}

export async function myCourses(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  if (user.role !== "STUDENT") throw ApiError.forbidden("Students only");
  const data = await accessService.getAssignedCoursesForStudent(user.id);
  res.json({ success: true, data });
}

export async function myAccessStatus(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await accessService.getAccessStatus(user.id);
  res.json({ success: true, data });
}
