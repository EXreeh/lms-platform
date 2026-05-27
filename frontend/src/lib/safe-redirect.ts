/** Allow only same-app relative paths (no protocol-relative or external URLs). */
export function getSafeRedirectPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.startsWith("/login") || value.startsWith("/register")) return null;
  return value;
}
