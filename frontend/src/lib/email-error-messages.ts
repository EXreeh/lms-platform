/** User-facing OTP email errors — must match backend EMAIL_USER_MESSAGES / API codes. */
const EMAIL_MESSAGES: Record<string, string> = {
  SMTP_AUTH_FAILED: "Email authentication failed. Please contact support.",
  SMTP_CONNECTION_FAILED:
    "We could not reach the mail server. Please try again in a few minutes.",
  EMAIL_SEND_FAILED: "OTP email could not be sent. Please try again later.",
};

export function getEmailErrorMessage(code?: string, _fallback?: string): string {
  if (code && code in EMAIL_MESSAGES) {
    return EMAIL_MESSAGES[code];
  }
  return EMAIL_MESSAGES.EMAIL_SEND_FAILED;
}
