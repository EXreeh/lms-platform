const VIDEO_DEBUG =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_LESSON_DEBUG === "true";

export function logVideoDebug(phase: string, details: Record<string, unknown>): void {
  if (!VIDEO_DEBUG) return;
  console.info(`[CognitiaX video] ${phase}`, details);
}

export function videoErrorLabel(code: number): string {
  switch (code) {
    case 1:
      return "MEDIA_ERR_ABORTED";
    case 2:
      return "MEDIA_ERR_NETWORK";
    case 3:
      return "MEDIA_ERR_DECODE";
    case 4:
      return "MEDIA_ERR_SRC_NOT_SUPPORTED";
    default:
      return `MEDIA_ERR_UNKNOWN(${code})`;
  }
}
