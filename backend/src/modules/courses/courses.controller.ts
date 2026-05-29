import type { Request, Response } from "express";
import * as coursesService from "./courses.service.js";
import { ApiError } from "../../utils/api-error.js";
import {
  listCoursesQuerySchema,
  type CreateCourseInput,
  type UpdateCourseInput,
  type CreateModuleInput,
  type CreateLessonInput,
} from "./courses.validation.js";

export async function create(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const course = await coursesService.createCourse(
    req.user.id,
    req.user.role,
    req.body as CreateCourseInput,
  );
  res.status(201).json({ success: true, data: { course } });
}

export async function update(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const course = await coursesService.updateCourse(
    req.user.id,
    req.user.role,
    req.params.idOrSlug,
    req.body as UpdateCourseInput,
  );
  res.json({ success: true, data: { course } });
}

export async function remove(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const result = await coursesService.deleteCourse(
    req.user.id,
    req.user.role,
    req.params.idOrSlug,
  );
  res.json({ success: true, ...result });
}

export async function list(req: Request, res: Response): Promise<void> {
  const query = listCoursesQuerySchema.parse(req.query);
  const courses = await coursesService.listCourses(
    req.user?.id,
    req.user?.role,
    query,
  );
  res.json({ success: true, data: { courses } });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const course = await coursesService.getCourse(
    req.params.idOrSlug,
    req.user?.id,
    req.user?.role,
  );
  res.json({ success: true, data: { course } });
}

export async function submitForReview(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const course = await coursesService.submitCourseForReview(
    req.user.id,
    req.user.role,
    req.params.idOrSlug,
  );
  res.json({ success: true, data: { course } });
}

export async function publish(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.role !== "ADMIN") {
    throw ApiError.forbidden("Only administrators can publish courses");
  }
  const { published } = req.body as { published: boolean };
  const course = published
    ? await coursesService.adminApproveCourse(req.user.id, req.params.idOrSlug)
    : await coursesService.adminUnpublishCourse(req.user.id, req.params.idOrSlug);
  res.json({ success: true, data: { course } });
}

export async function addModule(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const course = await coursesService.createModule(
    req.user.id,
    req.user.role,
    req.params.courseId,
    req.body as CreateModuleInput,
  );
  res.status(201).json({ success: true, data: { course } });
}

export async function addLesson(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const course = await coursesService.createLesson(
    req.user.id,
    req.user.role,
    req.params.moduleId,
    req.body as CreateLessonInput,
  );
  res.status(201).json({ success: true, data: { course } });
}

export async function removeModule(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const course = await coursesService.deleteModule(
    req.user.id,
    req.user.role,
    req.params.moduleId,
  );
  res.json({ success: true, data: { course } });
}

export async function removeLesson(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const course = await coursesService.deleteLesson(
    req.user.id,
    req.user.role,
    req.params.lessonId,
  );
  res.json({ success: true, data: { course } });
}

export async function categories(_req: Request, res: Response): Promise<void> {
  const categories = await coursesService.getCategories();
  res.json({ success: true, data: { categories } });
}

export async function enroll(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const result = await coursesService.enrollInCourse(req.user.id, req.params.idOrSlug);
  res.status(201).json({ success: true, data: result });
}

export async function reorderModules(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const { ids } = req.body as { ids: string[] };
  const course = await coursesService.reorderModules(
    req.user.id,
    req.user.role,
    req.params.courseId,
    ids,
  );
  res.json({ success: true, data: { course } });
}

export async function reorderLessons(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const { ids } = req.body as { ids: string[] };
  const course = await coursesService.reorderLessons(
    req.user.id,
    req.user.role,
    req.params.moduleId,
    ids,
  );
  res.json({ success: true, data: { course } });
}

export async function patchModule(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const course = await coursesService.updateModule(
    req.user.id,
    req.user.role,
    req.params.moduleId,
    req.body,
  );
  res.json({ success: true, data: { course } });
}

export async function patchLesson(req: Request, res: Response): Promise<void> {
  if (!req.user) throw ApiError.unauthorized();
  const course = await coursesService.updateLesson(
    req.user.id,
    req.user.role,
    req.params.lessonId,
    req.body,
  );
  res.json({ success: true, data: { course } });
}
