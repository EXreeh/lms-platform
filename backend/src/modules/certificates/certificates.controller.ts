import type { Request, Response } from "express";
import { ApiError } from "../../utils/api-error.js";
import * as certificatesService from "./certificates.service.js";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export async function eligibility(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const data = await certificatesService.checkEligibility(user.id, req.params.courseId);
  res.json({ success: true, data });
}

export async function generate(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const certificate = await certificatesService.generateCertificate(user.id, req.params.courseId);
  res.status(201).json({ success: true, data: { certificate } });
}

export async function getByCourse(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const certificate = await certificatesService.getCertificateByCourse(user.id, req.params.courseId);
  res.json({ success: true, data: { certificate } });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const certificate = await certificatesService.getStudentCertificate(user.id, req.params.certificateId);
  res.json({ success: true, data: { certificate } });
}

export async function listMine(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const certificates = await certificatesService.listStudentCertificates(user.id);
  res.json({ success: true, data: { certificates } });
}

export async function download(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  await certificatesService.streamCertificatePdf(
    res,
    req.params.certificateId,
    user.id,
    user.role,
  );
}

export async function verify(req: Request, res: Response): Promise<void> {
  const result = await certificatesService.verifyCertificate(req.params.code);
  res.json({ success: true, data: result });
}
