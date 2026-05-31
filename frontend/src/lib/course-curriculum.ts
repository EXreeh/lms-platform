import type { Course, Module } from "@/types/course";

/** Show only active curriculum items in the teacher editor (hide pending deletions). */
export function activeCurriculumModules(modules: Module[] = []): Module[] {
  return modules
    .filter((m) => m.deleteStatus !== "PENDING_DELETE" && m.deleteStatus !== "DELETED")
    .map((m) => ({
      ...m,
      lessons: m.lessons.filter(
        (l) => l.deleteStatus !== "PENDING_DELETE" && l.deleteStatus !== "DELETED",
      ),
    }));
}

export function countActiveLessons(course: Pick<Course, "modules">): number {
  return activeCurriculumModules(course.modules).reduce((sum, m) => sum + m.lessons.length, 0);
}
