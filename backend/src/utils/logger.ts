export function logAction(action: string, meta: Record<string, unknown> = {}): void {
  console.log(`[LMS] ${action}`, JSON.stringify({ ...meta, at: new Date().toISOString() }));
}
