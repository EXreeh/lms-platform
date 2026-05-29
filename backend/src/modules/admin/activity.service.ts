import type { ActivityType, Prisma } from "@lms/database";
import { prisma } from "../../config/database.js";

export async function logActivity(input: {
  type: ActivityType;
  userId?: string;
  courseId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.activityLog.create({
    data: {
      type: input.type,
      userId: input.userId ?? null,
      courseId: input.courseId ?? null,
      metadata: input.metadata ?? undefined,
    },
  });
}

export function activityMessage(
  type: ActivityType,
  meta: {
    userName?: string;
    courseTitle?: string;
    role?: string;
    score?: number;
  },
): string {
  switch (type) {
    case "LOGIN":
      return `${meta.userName ?? "User"} signed in`;
    case "COURSE_CREATED":
      return `${meta.userName ?? "Teacher"} created "${meta.courseTitle ?? "a course"}"`;
    case "COURSE_UPDATED":
      return `"${meta.courseTitle ?? "Course"}" was updated`;
    case "COURSE_SUBMITTED":
      return `"${meta.courseTitle ?? "Course"}" submitted for review`;
    case "COURSE_APPROVED":
      return `"${meta.courseTitle ?? "Course"}" was approved`;
    case "COURSE_REJECTED":
      return `"${meta.courseTitle ?? "Course"}" was rejected`;
    case "COURSE_PUBLISHED":
      return `"${meta.courseTitle ?? "Course"}" was published`;
    case "COURSE_ARCHIVED":
      return `"${meta.courseTitle ?? "Course"}" was archived`;
    case "DELETE_REQUESTED":
      return `Delete requested for ${meta.courseTitle ?? "content"}`;
    case "DELETE_APPROVED":
      return `Delete request approved`;
    case "ENROLLMENT":
      return `${meta.userName ?? "Student"} enrolled in "${meta.courseTitle ?? "a course"}"`;
    case "QUIZ_ATTEMPT":
      return `${meta.userName ?? "Student"} completed a quiz${meta.score !== undefined ? ` (${Math.round(meta.score)}%)` : ""}`;
    case "USER_ROLE_CHANGED":
      return `${meta.userName ?? "User"} role changed to ${meta.role ?? "unknown"}`;
    case "USER_SUSPENDED":
      return `${meta.userName ?? "User"} account was suspended`;
    case "USER_CREATED":
      return `${meta.userName ?? "User"} account created as ${meta.role ?? "user"}`;
    default:
      return "Platform activity recorded";
  }
}
