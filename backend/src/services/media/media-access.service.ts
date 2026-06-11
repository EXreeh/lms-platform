import type { Role } from "@lms/database";
import { prisma } from "../../config/database.js";
import { ApiError } from "../../utils/api-error.js";
import { hasActiveCourseAccess } from "../../modules/course-access/course-access.service.js";
import { assertCanAccessRecording } from "../../modules/live-classes/live-classes-access.js";
import { resolveLessonVideoUrl } from "../storage/video-url.helpers.js";
import { buildPublicMediaUrl } from "../storage/public-url.js";
import { getActiveCourseWhereClause } from "../../modules/courses/courses.helpers.js";
import { isAdminRole } from "../../utils/roles.js";

export interface VideoRef {
  videoUrl?: string | null;
  videoStorageKey?: string | null;
  videoStorageProvider?: string | null;
}

export interface MediaUser {
  id: string;
  role: Role;
}

/**
 * Resolve a playback URL only after access validation.
 * Future: swap buildPublicMediaUrl for signed private R2 URLs here.
 */
export function generateVideoUrl(videoStorageKey: string | null | undefined, _user: MediaUser): string | null {
  if (!videoStorageKey?.trim()) return null;
  return buildPublicMediaUrl(videoStorageKey) ?? null;
}

export async function validateCourseVideoAccess(user: MediaUser, courseId: string): Promise<void> {
  const course = await prisma.course.findFirst({
    where: { id: courseId, ...getActiveCourseWhereClause() },
    select: { id: true, teacherId: true, status: true },
  });
  if (!course) throw ApiError.notFound("Course not found");

  if (isAdminRole(user.role)) return;
  if (user.role === "TEACHER" && course.teacherId === user.id) return;

  if (user.role === "STUDENT") {
    const allowed = await hasActiveCourseAccess(user.id, courseId);
    if (!allowed) throw ApiError.forbidden("You do not have access to this course", "COURSE_ACCESS_DENIED");
    return;
  }

  throw ApiError.forbidden("You do not have access to this course", "COURSE_ACCESS_DENIED");
}

export async function validateBatchRecordingAccess(user: MediaUser, batchId: string): Promise<void> {
  if (isAdminRole(user.role)) return;

  if (user.role === "TEACHER") {
    const batch = await prisma.batch.findFirst({
      where: { id: batchId, teacherId: user.id, status: "ACTIVE" },
      select: { id: true },
    });
    if (!batch) throw ApiError.forbidden("You do not have access to this batch recording", "BATCH_ACCESS_DENIED");
    return;
  }

  if (user.role === "STUDENT") {
    const membership = await prisma.batchStudent.findFirst({
      where: { batchId, studentId: user.id, batch: { status: "ACTIVE" } },
      select: { id: true },
    });
    if (!membership) {
      throw ApiError.forbidden("You do not have access to this batch recording", "BATCH_ACCESS_DENIED");
    }
    return;
  }

  throw ApiError.forbidden("Insufficient permissions", "BATCH_ACCESS_DENIED");
}

export async function validateVideoAccess(user: MediaUser, video: VideoRef & { courseId?: string }): Promise<void> {
  if (!video.courseId) {
    throw ApiError.forbidden("Video access denied", "VIDEO_ACCESS_DENIED");
  }
  await validateCourseVideoAccess(user, video.courseId);
}

export async function resolveProtectedLessonVideoUrl(
  user: MediaUser,
  courseId: string,
  lesson: VideoRef,
): Promise<string | null> {
  await validateCourseVideoAccess(user, courseId);
  const key = lesson.videoStorageKey?.trim();
  if (key) {
    return generateVideoUrl(key, user) ?? resolveLessonVideoUrl(lesson);
  }
  return resolveLessonVideoUrl(lesson);
}

export async function resolveProtectedRecordingUrl(
  user: MediaUser,
  recording: {
    batchId: string;
    teacherId: string;
    courseId: string;
    status: string;
    videoUrl: string;
    videoStorageKey?: string | null;
  },
): Promise<string> {
  await assertCanAccessRecording(user.role, user.id, recording);

  const key = recording.videoStorageKey?.trim();
  if (key) {
    return generateVideoUrl(key, user) ?? recording.videoUrl;
  }
  return recording.videoUrl;
}
