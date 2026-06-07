import type { Request, Response } from "express";
import { ApiError } from "../../utils/api-error.js";
import * as batchesService from "./batches.service.js";
import {
  batchListQuerySchema,
  batchStudentsSchema,
  createBatchSchema,
  updateBatchSchema,
} from "./batches.validation.js";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export async function listAdmin(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const query = batchListQuerySchema.parse(req.query);
  const data = await batchesService.listBatches(query);
  res.json({ success: true, data });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const includeAccess = user.role === "TEACHER" || user.role === "ADMIN";
  const data = await batchesService.getBatchById(req.params.batchId, { includeAccess });
  if (user.role === "TEACHER" && data.teacherId !== user.id) {
    throw ApiError.forbidden("Batch not assigned to you");
  }
  if (user.role === "STUDENT") {
    const member = data.students.some((s) => s.studentId === user.id);
    if (!member) throw ApiError.forbidden("You are not in this batch");
  }
  res.json({ success: true, data });
}

export async function create(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const body = createBatchSchema.parse(req.body);
  const data = await batchesService.createBatch(body, user.id);
  res.status(201).json({ success: true, data });
}

export async function update(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const body = updateBatchSchema.parse(req.body);
  const data = await batchesService.updateBatch(req.params.batchId, body);
  res.json({ success: true, data });
}

export async function addStudents(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const { studentIds } = batchStudentsSchema.parse(req.body);
  const data = await batchesService.addStudentsToBatch(
    req.params.batchId,
    studentIds,
    user.id,
  );
  res.json({ success: true, data });
}

export async function removeStudent(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const data = await batchesService.removeStudentFromBatch(
    req.params.batchId,
    req.params.studentId,
  );
  res.json({ success: true, data });
}

export async function removeBatch(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const result = await batchesService.deleteBatch(req.params.batchId);
  res.json({ success: true, ...result });
}

export async function teacherList(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await batchesService.getTeacherBatches(user.id);
  res.json({ success: true, data });
}

export async function studentMine(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await batchesService.getStudentBatch(user.id);
  res.json({ success: true, data });
}
