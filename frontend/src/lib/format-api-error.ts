import { ApiClientError } from "./api";

const FRIENDLY_BY_CODE: Record<string, string> = {
  ALREADY_ENROLLED: "You are already enrolled in this course.",
  PAYMENT_REQUIRED: "Please complete payment before enrolling in this course.",
  FREE_COURSE: "This course is free — use Enroll instead of checkout.",
  INVALID_SIGNATURE: "Payment could not be verified. Please contact support if you were charged.",
  INVALID_PASSWORD: "Current password is incorrect.",
  FILE_TOO_LARGE: "File too large. Please choose a smaller file.",
  INVALID_FILE: "Unsupported file type.",
  INVALID_FILE_TYPE: "Unsupported file type.",
  NO_FILE: "Please select a file to upload.",
  UPLOAD_ERROR: "Upload failed. Please try again.",
  UNAUTHORIZED: "Please sign in to continue.",
  FORBIDDEN: "You do not have permission to perform this action.",
  NOT_FOUND: "The requested item could not be found.",
  ALREADY_PAID: "Payment for this course was already completed.",
};

const FRIENDLY_BY_STATUS: Record<number, string> = {
  400: "Please check your input and try again.",
  401: "Your session expired. Please sign in again.",
  403: "You do not have permission to do that.",
  404: "We could not find what you were looking for.",
  409: "This action conflicts with the current state.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Our server encountered an error. Please try again shortly.",
  503: "The service is temporarily unavailable. Please try again later.",
};

export function formatApiError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (err instanceof ApiClientError) {
    if (err.code && FRIENDLY_BY_CODE[err.code]) {
      const friendly = FRIENDLY_BY_CODE[err.code];
      if (friendly) return friendly;
    }
    if (err.errors) {
      const parts = Object.entries(err.errors).flatMap(([, messages]) =>
        (messages ?? []).map((m) => m),
      );
      if (parts.length > 0) {
        return parts.join(" ");
      }
    }
    if (err.message && err.message !== "Request failed") {
      return err.message;
    }
    return FRIENDLY_BY_STATUS[err.status] ?? fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
