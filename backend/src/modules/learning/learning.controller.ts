import type { Request, Response } from "express";
import { ApiError } from "../../utils/api-error.js";
import * as learningService from "./learning.service.js";
import type { WatchProgressInput } from "./learning.validation.js";

function requireStudent(req: Request): string {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.role !== "STUDENT") {
    throw ApiError.forbidden("Only students can access learning features");
  }
  return req.user.id;
}

export async function enroll(req: Request, res: Response): Promise<void> {
  const studentId = requireStudent(req);
  const result = await learningService.enrollInCourse(studentId, req.params.slug);
  res.status(201).json({ success: true, data: result });
}

export async function enrolledCourses(req: Request, res: Response): Promise<void> {
  const studentId = requireStudent(req);
  const enrollments = await learningService.getEnrolledCourses(studentId);
  res.json({ success: true, data: { enrollments } });
}

export async function courseProgress(req: Request, res: Response): Promise<void> {
  const studentId = requireStudent(req);
  const progress = await learningService.getCourseProgress(studentId, req.params.slug);
  res.json({ success: true, data: progress });
}

export async function completeLesson(req: Request, res: Response): Promise<void> {
  const studentId = requireStudent(req);
  const result = await learningService.markLessonCompleted(studentId, req.params.lessonId);
  res.json({ success: true, data: result });
}

export async function watchProgress(req: Request, res: Response): Promise<void> {
  const studentId = requireStudent(req);
  const { watchedDuration } = req.body as WatchProgressInput;
  const result = await learningService.updateWatchedDuration(
    studentId,
    req.params.lessonId,
    watchedDuration,
  );
  res.json({ success: true, data: result });
}

export async function continueLearning(req: Request, res: Response): Promise<void> {
  const studentId = requireStudent(req);
  const result = await learningService.getContinueLearning(studentId);
  res.json({ success: true, data: { continueLearning: result } });
}

export async function analytics(req: Request, res: Response): Promise<void> {
  const studentId = requireStudent(req);
  const result = await learningService.getStudentAnalytics(studentId);
  res.json({ success: true, data: result });
}
