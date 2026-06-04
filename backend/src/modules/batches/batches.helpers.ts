import type { Prisma } from "@lms/database";

const batchInclude = {
  course: { select: { id: true, title: true, slug: true } },
  teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
  students: {
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" as const },
  },
  _count: { select: { students: true, liveClasses: true } },
} satisfies Prisma.BatchInclude;

export { batchInclude };

export function mapBatch(
  batch: Prisma.BatchGetPayload<{ include: typeof batchInclude }>,
  options?: { studentAccess?: Record<string, string> },
) {
  return {
    id: batch.id,
    name: batch.name,
    description: batch.description,
    courseId: batch.courseId,
    teacherId: batch.teacherId,
    startDate: batch.startDate.toISOString(),
    endDate: batch.endDate?.toISOString() ?? null,
    timing: batch.timing,
    daysOfWeek: batch.daysOfWeek,
    status: batch.status,
    createdAt: batch.createdAt.toISOString(),
    updatedAt: batch.updatedAt.toISOString(),
    course: batch.course,
    teacher: batch.teacher
      ? {
          id: batch.teacher.id,
          name: `${batch.teacher.firstName} ${batch.teacher.lastName}`.trim(),
          email: batch.teacher.email,
        }
      : null,
    studentCount: batch._count.students,
    liveClassCount: batch._count.liveClasses,
    students: batch.students.map((bs) => ({
      id: bs.id,
      studentId: bs.studentId,
      joinedAt: bs.joinedAt.toISOString(),
      name: `${bs.student.firstName} ${bs.student.lastName}`.trim(),
      email: bs.student.email,
      accessStatus: options?.studentAccess?.[bs.studentId],
    })),
  };
}
