import { getFileExtensionFromName } from "@/lib/file-extension";

export type ResourceAccessMode = "open" | "download";

const PREVIEWABLE_EXTENSIONS = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".txt",
]);

const PREVIEWABLE_MIME_PREFIXES = ["application/pdf", "image/", "text/plain"];

const DOWNLOAD_ONLY_EXTENSIONS = new Set([
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".zip",
]);

export function getResourceAccessMode(input: {
  url: string;
  fileName?: string | null;
  mimeType?: string | null;
}): ResourceAccessMode {
  const { url, fileName, mimeType } = input;

  if (!url.startsWith("/uploads/resources/")) {
    return "open";
  }

  const ext = getFileExtensionFromName(fileName ?? url);

  if (DOWNLOAD_ONLY_EXTENSIONS.has(ext)) {
    return "download";
  }

  if (PREVIEWABLE_EXTENSIONS.has(ext)) {
    return "open";
  }

  if (mimeType) {
    if (mimeType === "application/pdf" || mimeType.startsWith("text/plain")) {
      return "open";
    }
    if (PREVIEWABLE_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix))) {
      return "open";
    }
    if (
      mimeType.includes("word") ||
      mimeType.includes("document") ||
      mimeType.includes("presentation") ||
      mimeType.includes("zip")
    ) {
      return "download";
    }
  }

  return "download";
}

export function isPreviewableResource(input: {
  url: string;
  fileName?: string | null;
  mimeType?: string | null;
}): boolean {
  return getResourceAccessMode(input) === "open";
}
