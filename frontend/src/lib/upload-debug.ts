import type { UploadKind } from "./uploads-api";

const UPLOAD_DEBUG = process.env.NODE_ENV === "development";

export function logUploadDebug(
  phase: string,
  details: Record<string, unknown>,
): void {
  if (!UPLOAD_DEBUG) return;
  console.info(`[CognitiaX upload] ${phase}`, details);
}

export function logUploadFileSelected(kind: UploadKind, file: File): void {
  logUploadDebug("file selected", {
    kind,
    name: file.name,
    size: file.size,
    sizeLabel: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    mimeType: file.type || "(empty)",
  });
}

export function logUploadRequest(kind: UploadKind, url: string): void {
  logUploadDebug("request", { kind, url, method: "POST", credentials: "include" });
}

export function logUploadResponse(
  kind: UploadKind,
  status: number,
  body: string,
): void {
  logUploadDebug("response", {
    kind,
    status,
    body: body.slice(0, 1000),
  });
}
