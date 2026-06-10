export function isActiveCourse(course: {
  deleteStatus?: string;
  status?: string;
}): boolean {
  return course.deleteStatus === "ACTIVE" && course.status !== "ARCHIVED";
}

export function filterActiveCourses<T extends { deleteStatus?: string; status?: string }>(
  courses: T[],
): T[] {
  return courses.filter(isActiveCourse);
}

/** Params for admin course selectors (teacher/batch/access dropdowns). */
export const ACTIVE_COURSE_LIST_PARAMS = {
  limit: 100,
  activeOnly: true,
  status: "APPROVED" as const,
};
