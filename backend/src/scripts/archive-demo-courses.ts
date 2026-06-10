/**
 * Optional admin utility: archive demo-looking courses by title pattern.
 * Does not run automatically. Invoke manually:
 *   npx tsx src/scripts/archive-demo-courses.ts
 */
import { prisma } from "../config/database.js";
import { getActiveCourseWhereClause } from "../modules/courses/courses.helpers.js";

const DEMO_COURSE_TITLE_PATTERNS = [
  "Demo Course",
  "Sample Course",
  "Test Course",
  "Python Demo",
  "React Demo",
  "JavaScript Basics Demo",
];

async function main() {
  const candidates = await prisma.course.findMany({
    where: {
      ...getActiveCourseWhereClause(),
      OR: DEMO_COURSE_TITLE_PATTERNS.map((pattern) => ({
        title: { contains: pattern, mode: "insensitive" },
      })),
    },
    select: { id: true, title: true, slug: true },
  });

  if (candidates.length === 0) {
    console.log("No demo-looking active courses found.");
    return;
  }

  const ids = candidates.map((c) => c.id);
  await prisma.$transaction([
    prisma.course.updateMany({
      where: { id: { in: ids } },
      data: { status: "ARCHIVED", deleteStatus: "DELETED" },
    }),
    prisma.studentCourseAccess.updateMany({
      where: { courseId: { in: ids }, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  console.log(`Archived ${candidates.length} demo-looking course(s):`);
  for (const course of candidates) {
    console.log(`  - ${course.title} (${course.slug})`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
