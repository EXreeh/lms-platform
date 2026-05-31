import type { Response } from "express";
import { prisma } from "../../config/database.js";
import { ApiError } from "../../utils/api-error.js";
import { logActivity } from "../admin/activity.service.js";
import { logAction } from "../../utils/logger.js";
import {
  buildCertificatePdf,
} from "./certificate-pdf.js";
import {
  generateCertificateNumber,
  generateVerificationCode,
  getCertificateEligibility,
  mapCertificate,
  type CertificateWithRelations,
  type MappedCertificate,
} from "./certificates.helpers.js";

const certInclude = {
  student: { select: { id: true, firstName: true, lastName: true, email: true } },
  course: { select: { id: true, title: true, slug: true, category: true, level: true } },
} as const;

async function getCertOrThrow(certificateId: string) {
  const cert = await prisma.certificate.findUnique({
    where: { id: certificateId },
    include: certInclude,
  });
  if (!cert) throw ApiError.notFound("Certificate not found");
  return cert as CertificateWithRelations;
}

export async function checkEligibility(studentId: string, courseIdOrSlug: string) {
  return getCertificateEligibility(studentId, courseIdOrSlug);
}

export async function generateCertificate(studentId: string, courseIdOrSlug: string): Promise<MappedCertificate> {
  const course = await prisma.course.findFirst({
    where: {
      OR: [{ id: courseIdOrSlug }, { slug: courseIdOrSlug }],
      status: "APPROVED",
      deleteStatus: "ACTIVE",
    },
  });
  if (!course) throw ApiError.notFound("Course not found");

  const eligibility = await getCertificateEligibility(studentId, course.id);
  if (eligibility.alreadyIssued && eligibility.certificateId) {
    const existing = await getCertOrThrow(eligibility.certificateId);
    return mapCertificate(existing);
  }
  if (!eligibility.eligible) {
    throw ApiError.badRequest(
      eligibility.reasons.join(". ") || "Certificate requirements not met",
    );
  }

  const certificate = await prisma.certificate.create({
    data: {
      studentId,
      courseId: course.id,
      certificateNumber: generateCertificateNumber(),
      verificationCode: generateVerificationCode(),
    },
    include: certInclude,
  });

  const pdfUrl = `/api/certificates/${certificate.id}/download`;
  const updated = await prisma.certificate.update({
    where: { id: certificate.id },
    data: { pdfUrl },
    include: certInclude,
  });

  await logActivity({
    type: "CERTIFICATE_ISSUED",
    userId: studentId,
    courseId: course.id,
    metadata: {
      certificateId: updated.id,
      certificateNumber: updated.certificateNumber,
    },
  });
  logAction("[Certificate] issued", {
    studentId,
    courseId: course.id,
    certificateId: updated.id,
  });

  return mapCertificate(updated as CertificateWithRelations);
}

export async function getStudentCertificate(studentId: string, certificateId: string): Promise<MappedCertificate> {
  const cert = await getCertOrThrow(certificateId);
  if (cert.studentId !== studentId) throw ApiError.forbidden();
  return mapCertificate(cert);
}

export async function getCertificateByCourse(studentId: string, courseIdOrSlug: string): Promise<MappedCertificate | null> {
  const course = await prisma.course.findFirst({
    where: { OR: [{ id: courseIdOrSlug }, { slug: courseIdOrSlug }] },
  });
  if (!course) throw ApiError.notFound("Course not found");

  const cert = await prisma.certificate.findUnique({
    where: { studentId_courseId: { studentId, courseId: course.id } },
    include: certInclude,
  });
  if (!cert) return null;
  return mapCertificate(cert as CertificateWithRelations);
}

export async function listStudentCertificates(studentId: string): Promise<MappedCertificate[]> {
  const certs = await prisma.certificate.findMany({
    where: { studentId },
    include: certInclude,
    orderBy: { issuedAt: "desc" },
  });
  return certs.map((c) => mapCertificate(c as CertificateWithRelations));
}

export async function verifyCertificate(code: string): Promise<
  | { valid: false; message: string }
  | { valid: true; certificate: MappedCertificate }
> {
  const cert = await prisma.certificate.findUnique({
    where: { verificationCode: code.toUpperCase() },
    include: certInclude,
  });
  if (!cert) {
    return { valid: false as const, message: "Certificate not found" };
  }
  return {
    valid: true as const,
    certificate: mapCertificate(cert as CertificateWithRelations),
  };
}

export async function streamCertificatePdf(
  res: Response,
  certificateId: string,
  requesterId?: string,
  requesterRole?: string,
) {
  const cert = await getCertOrThrow(certificateId);
  if (requesterRole !== "ADMIN" && cert.studentId !== requesterId) {
    throw ApiError.forbidden();
  }

  const doc = buildCertificatePdf(cert);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="cognitiax-certificate-${cert.certificateNumber}.pdf"`,
  );
  doc.pipe(res);
}

export async function streamCertificatePdfAdmin(res: Response, certificateId: string, adminId: string) {
  return streamCertificatePdf(res, certificateId, adminId, "ADMIN");
}

export async function listAdminCertificates(): Promise<MappedCertificate[]> {
  const certs = await prisma.certificate.findMany({
    include: certInclude,
    orderBy: { issuedAt: "desc" },
  });
  return certs.map((c) => mapCertificate(c as CertificateWithRelations));
}
