export function resolveVideoContentType(mimeType: string, filename: string): string {
  const ext = filename.includes(".")
    ? filename.slice(filename.lastIndexOf(".")).toLowerCase()
    : "";

  if (ext === ".mp4") return "video/mp4";
  if (ext === ".webm") return "video/webm";
  if (ext === ".mov") return "video/quicktime";
  if (mimeType.startsWith("video/")) return mimeType;
  return mimeType || "application/octet-stream";
}
