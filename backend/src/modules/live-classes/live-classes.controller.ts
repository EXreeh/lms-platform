import type { Request, Response } from "express";
import { ApiError } from "../../utils/api-error.js";
import * as liveClassesService from "./live-classes.service.js";
import { createLiveClassSchema, liveClassListQuerySchema } from "./live-classes.validation.js";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export async function list(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const query = liveClassListQuerySchema.parse(req.query);

  const filters: Parameters<typeof liveClassesService.listLiveClasses>[0] = {
    batchId: query.batchId,
    upcoming: query.upcoming === "true",
  };

  if (user.role === "TEACHER") filters.teacherId = user.id;
  if (user.role === "STUDENT") filters.studentId = user.id;

  const data = await liveClassesService.listLiveClasses(filters);
  res.json({ success: true, data });
}

export async function create(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const body = createLiveClassSchema.parse(req.body);
  const data = await liveClassesService.createLiveClass(body);
  res.status(201).json({ success: true, data });
}
