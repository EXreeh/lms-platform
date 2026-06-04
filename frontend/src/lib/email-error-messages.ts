/** User-facing messages for OTP / password-reset email failures. */
export function getEmailErrorMessage(code?: string, fallback?: string): string {
  switch (code) {
    case "SMTP_AUTH_FAILED":
      return "We could not send the verification email because the mail server rejected our login. Please try again later or contact support.";
    case "SMTP_CONNECTION_FAILED":
      return "We could not reach the mail server. Please try again in a few minutes.";
    case "EMAIL_SEND_FAILED":
      return fallback ?? "OTP email could not be sent. Please try again later.";
    default:
      return fallback ?? "OTP email could not be sent. Please try again later.";
  }
}
