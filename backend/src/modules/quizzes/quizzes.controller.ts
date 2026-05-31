import type { Request, Response } from "express";
import { ApiError } from "../../utils/api-error.js";
import * as quizzesService from "./quizzes.service.js";
import { logAction } from "../../utils/logger.js";
import type {
  CreateQuestionInput,
  CreateQuizInput,
  SubmitQuizInput,
  UpdateQuestionInput,
  UpdateQuizInput,
} from "./quizzes.validation.js";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

function requireStaff(req: Request) {
  const user = requireUser(req);
  if (user.role !== "TEACHER" && user.role !== "ADMIN") {
    throw ApiError.forbidden("Only teachers and admins can manage quizzes");
  }
  return user;
}

function requireStudent(req: Request) {
  const user = requireUser(req);
  if (user.role !== "STUDENT") {
    throw ApiError.forbidden("Only students can attempt quizzes");
  }
  return user;
}

export async function create(req: Request, res: Response): Promise<void> {
  const user = requireStaff(req);
  logAction("quiz.create.request", { userId: user.id, body: req.body });
  const quiz = await quizzesService.createQuiz(user.id, user.role, req.body as CreateQuizInput);
  res.status(201).json({ success: true, data: { quiz } });
}

export async function update(req: Request, res: Response): Promise<void> {
  const user = requireStaff(req);
  const quiz = await quizzesService.updateQuiz(
    user.id,
    user.role,
    req.params.quizId,
    req.body as UpdateQuizInput,
  );
  res.json({ success: true, data: { quiz } });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const user = requireStaff(req);
  const result = await quizzesService.deleteQuiz(user.id, user.role, req.params.quizId);
  res.json({ success: true, ...result });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const quiz = await quizzesService.getQuiz(user.id, user.role, req.params.quizId);
  res.json({ success: true, data: { quiz } });
}

export async function listMine(req: Request, res: Response): Promise<void> {
  const user = requireStaff(req);
  logAction("[Quiz] list teacher quizzes request", {
    userId: user.id,
    role: user.role,
  });
  try {
    const quizzes = await quizzesService.listTeacherQuizzes(user.id, user.role);
    logAction("[Quiz] list teacher quizzes success", {
      userId: user.id,
      role: user.role,
      count: quizzes.length,
    });
    res.json({ success: true, data: { quizzes } });
  } catch (err) {
    logAction("[Quiz] list teacher quizzes error", {
      userId: user.id,
      role: user.role,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

export async function listByLesson(req: Request, res: Response): Promise<void> {
  const user = requireStaff(req);
  const quizzes = await quizzesService.listQuizzesByLesson(user.id, user.role, req.params.lessonId);
  res.json({ success: true, data: { quizzes } });
}

export async function analytics(req: Request, res: Response): Promise<void> {
  const user = requireStaff(req);
  const data = await quizzesService.getQuizAnalytics(user.id, user.role, req.params.quizId);
  res.json({ success: true, data });
}

export async function addQuestion(req: Request, res: Response): Promise<void> {
  const user = requireStaff(req);
  const question = await quizzesService.addQuestion(
    user.id,
    user.role,
    req.params.quizId,
    req.body as CreateQuestionInput,
  );
  res.status(201).json({ success: true, data: { question } });
}

export async function patchQuestion(req: Request, res: Response): Promise<void> {
  const user = requireStaff(req);
  const question = await quizzesService.updateQuestion(
    user.id,
    user.role,
    req.params.questionId,
    req.body as UpdateQuestionInput,
  );
  res.json({ success: true, data: { question } });
}

export async function removeQuestion(req: Request, res: Response): Promise<void> {
  const user = requireStaff(req);
  const result = await quizzesService.deleteQuestion(user.id, user.role, req.params.questionId);
  res.json({ success: true, ...result });
}

export async function preview(req: Request, res: Response): Promise<void> {
  const user = requireStudent(req);
  const data = await quizzesService.getQuizPreview(user.id, req.params.quizId);
  res.json({ success: true, data });
}

export async function start(req: Request, res: Response): Promise<void> {
  const user = requireStudent(req);
  const data = await quizzesService.startQuiz(user.id, req.params.quizId);
  res.status(201).json({ success: true, data });
}

export async function getAttempt(req: Request, res: Response): Promise<void> {
  const user = requireStudent(req);
  const data = await quizzesService.getAttemptForStudent(user.id, req.params.attemptId);
  res.json({ success: true, data });
}

export async function submit(req: Request, res: Response): Promise<void> {
  const user = requireStudent(req);
  const data = await quizzesService.submitQuiz(
    user.id,
    req.params.attemptId,
    req.body as SubmitQuizInput,
  );
  res.json({ success: true, data });
}

export async function result(req: Request, res: Response): Promise<void> {
  const user = requireStudent(req);
  const data = await quizzesService.getAttemptResult(user.id, req.params.attemptId);
  res.json({ success: true, data });
}

export async function listForLessonStudent(req: Request, res: Response): Promise<void> {
  const user = requireStudent(req);
  const quizzes = await quizzesService.listLessonQuizzesForStudent(user.id, req.params.lessonId);
  res.json({ success: true, data: { quizzes } });
}
