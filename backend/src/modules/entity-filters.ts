import type { Prisma } from "@lms/database";
import { getActiveCourseWhereClause } from "./courses/courses.helpers.js";

export { getActiveCourseWhereClause };

export function getActiveBatchWhereClause(): Prisma.BatchWhereInput {
  return { status: "ACTIVE" };
}

export function getActiveUserWhereClause(): Prisma.UserWhereInput {
  return { suspended: false };
}

export function getActiveRecordingWhereClause(): Prisma.LiveClassRecordingWhereInput {
  return { status: "ACTIVE" };
}
