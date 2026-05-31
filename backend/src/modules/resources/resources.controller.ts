import type { Request, Response } from "express";
import { ApiError } from "../../utils/api-error.js";
import * as resourcesService from "./resources.service.js";
import type { CreateResourceInput, UpdateResourceInput } from "./resources.validation.js";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export async function create(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const resource = await resourcesService.createResource(
    user.id,
    user.role,
    req.body as CreateResourceInput,
  );
  res.status(201).json({ success: true, data: { resource } });
}

export async function update(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const resource = await resourcesService.updateResource(
    user.id,
    user.role,
    req.params.resourceId,
    req.body as UpdateResourceInput,
  );
  res.json({ success: true, data: { resource } });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const result = await resourcesService.deleteResource(user.id, user.role, req.params.resourceId);
  res.json({ success: true, ...result });
}

export async function listMine(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const resources = await resourcesService.listTeacherResources(user.id, user.role);
  res.json({ success: true, data: { resources } });
}

export async function listByCourse(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const visibility =
    user.role === "ADMIN" ? "admin" : user.role === "TEACHER" ? "manage" : "student";
  const resources = await resourcesService.listCourseResources(req.params.courseId, visibility);
  res.json({ success: true, data: { resources } });
}

export async function listByLesson(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const visibility =
    user.role === "ADMIN" ? "admin" : user.role === "TEACHER" ? "manage" : "student";
  const resources = await resourcesService.listLessonResources(req.params.lessonId, visibility);
  res.json({ success: true, data: { resources } });
}

export async function listByCourseStudent(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const resources = await resourcesService.listCourseResourcesForStudent(
    user.id,
    req.params.courseId,
  );
  res.json({ success: true, data: { resources } });
}

export async function listByLessonStudent(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const resources = await resourcesService.listLessonResourcesForStudent(
    user.id,
    req.params.lessonId,
  );
  res.json({ success: true, data: { resources } });
}
