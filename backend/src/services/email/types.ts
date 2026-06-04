export type EmailProviderName = "smtp" | "resend";

export type EmailErrorCode =
  | "EMAIL_AUTH_FAILED"
  | "EMAIL_PROVIDER_NOT_CONFIGURED"
  | "EMAIL_SEND_FAILED"
  /** @deprecated SMTP-specific; mapped to user messages via EMAIL_AUTH_FAILED / EMAIL_SEND_FAILED */
  | "SMTP_AUTH_FAILED"
  | "SMTP_CONNECTION_FAILED";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export const EMAIL_USER_MESSAGES: Record<
  "EMAIL_AUTH_FAILED" | "EMAIL_PROVIDER_NOT_CONFIGURED" | "EMAIL_SEND_FAILED",
  string
> = {
  EMAIL_AUTH_FAILED: "Email authentication failed. Please contact support.",
  EMAIL_PROVIDER_NOT_CONFIGURED:
    "Email service is not configured. Please contact support.",
  EMAIL_SEND_FAILED: "OTP email could not be sent. Please try again later.",
};
