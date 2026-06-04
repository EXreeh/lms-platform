/** User-facing OTP email errors — keyed by backend API `code`. */
const EMAIL_MESSAGES: Record<string, string> = {
  EMAIL_AUTH_FAILED: "Email authentication failed. Please contact support.",
  EMAIL_PROVIDER_NOT_CONFIGURED:
    "Email service is not configured. Please contact support.",
  EMAIL_SEND_FAILED: "OTP email could not be sent. Please try again later.",
  SMTP_AUTH_FAILED: "Email authentication failed. Please contact support.",
  SMTP_CONNECTION_FAILED:
    "We could not reach the mail server. Please try again in a few minutes.",
};

export function getEmailErrorMessage(code?: string, _fallback?: string): string {
  if (code && code in EMAIL_MESSAGES) {
    return EMAIL_MESSAGES[code];
  }
  return EMAIL_MESSAGES.EMAIL_SEND_FAILED;
}
