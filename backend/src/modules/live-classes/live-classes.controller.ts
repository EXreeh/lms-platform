import type { Request, Response } from "express";
import { ApiError } from "../../utils/api-error.js";
import * as liveClassesService from "./live-classes.service.js";
import {
  createLiveClassSchema,
  createRecordingSchema,
  liveClassListQuerySchema,
  recordingListQuerySchema,
  updateLiveClassSchema,
  updateLiveClassStatusSchema,
} from "./live-classes.validation.js";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

function actor(req: Request) {
  const user = requireUser(req);
  return { role: user.role, userId: user.id };
}

export async function list(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const query = liveClassListQuerySchema.parse(req.query);

  const filters: Parameters<typeof liveClassesService.listLiveClasses>[0] = {
    batchId: query.batchId,
    courseId: query.courseId,
    status: query.status,
    upcoming: query.upcoming === "true",
    from: query.from,
    to: query.to,
    search: query.search,
  };

  if (user.role === "TEACHER") filters.teacherId = user.id;
  if (user.role === "STUDENT") filters.studentId = user.id;
  if (user.role === "ADMIN" && query.teacherId) filters.teacherId = query.teacherId;

  const data = await liveClassesService.listLiveClasses(filters, user.role);
  res.json({ success: true, data });
}

export async function listUpcoming(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  if (user.role !== "STUDENT") throw ApiError.forbidden();
  const data = await liveClassesService.listUpcomingLiveClasses(user.id);
  res.json({ success: true, data });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await liveClassesService.getLiveClassById(req.params.id, user.role, user.id);
  res.json({ success: true, data });
}

export async function join(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await liveClassesService.joinLiveClass(req.params.id, user.role, user.id);
  res.json({ success: true, data });
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = createLiveClassSchema.parse(req.body);
  const data = await liveClassesService.createLiveClass(body, actor(req));
  res.status(201).json({ success: true, data });
}

export async function update(req: Request, res: Response): Promise<void> {
  const body = updateLiveClassSchema.parse(req.body);
  const data = await liveClassesService.updateLiveClass(req.params.id, body, actor(req));
  res.json({ success: true, data });
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const body = updateLiveClassStatusSchema.parse(req.body);
  const data = await liveClassesService.updateLiveClassStatus(req.params.id, body.status, actor(req));
  res.json({ success: true, data });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const data = await liveClassesService.deleteLiveClass(req.params.id, actor(req));
  res.json({ success: true, data, message: "Live class cancelled" });
}

export async function stats(req: Request, res: Response): Promise<void> {
  const data = await liveClassesService.getLiveClassStats(actor(req));
  res.json({ success: true, data });
}

export async function listRecordings(req: Request, res: Response): Promise<void> {
  const query = recordingListQuerySchema.parse(req.query);
  const data = await liveClassesService.listRecordings(
    {
      batchId: query.batchId,
      courseId: query.courseId,
      liveClassId: query.liveClassId,
      status: query.status,
    },
    actor(req),
  );
  res.json({ success: true, data });
}

export async function getRecording(req: Request, res: Response): Promise<void> {
  const data = await liveClassesService.getRecordingById(req.params.id, actor(req));
  res.json({ success: true, data });
}

export async function uploadRecording(req: Request, res: Response): Promise<void> {
  if (!req.file) throw ApiError.badRequest("No video file uploaded", "NO_FILE");
  const body = createRecordingSchema.parse(req.body);
  const data = await liveClassesService.uploadRecording(
    req.params.id,
    req.file,
    body,
    actor(req),
  );
  res.status(201).json({ success: true, data });
}

export async function archiveRecording(req: Request, res: Response): Promise<void> {
  const data = await liveClassesService.updateRecordingStatus(
    req.params.id,
    "ARCHIVED",
    actor(req),
  );
  res.json({ success: true, data });
}

export async function deleteRecording(req: Request, res: Response): Promise<void> {
  const data = await liveClassesService.updateRecordingStatus(
    req.params.id,
    "DELETED",
    actor(req),
  );
  res.json({ success: true, data, message: "Recording removed" });
}

export async function studentBatchRecordings(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  if (user.role !== "STUDENT" && user.role !== "ADMIN") {
    throw ApiError.forbidden();
  }
  const data = await liveClassesService.listRecordings(
    { batchId: req.params.batchId, status: "ACTIVE" },
    { role: user.role, userId: user.id },
  );
  res.json({ success: true, data });
}

export async function studentCourseBatchRecordings(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  if (user.role !== "STUDENT") throw ApiError.forbidden();
  const data = await liveClassesService.getStudentCourseBatchRecordings(
    user.id,
    req.params.courseId,
  );
  res.json({ success: true, data });
}
