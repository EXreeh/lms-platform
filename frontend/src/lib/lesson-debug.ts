const LESSON_DEBUG =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_LESSON_DEBUG === "true";

export function logLessonDebug(phase: string, details: Record<string, unknown>): void {
  if (!LESSON_DEBUG) return;
  console.info(`[CognitiaX lesson] ${phase}`, details);
}
