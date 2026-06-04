import { env, isEmailProviderConfigured } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";
import { sendViaResend, verifyResendProvider, logResendSafeConfig } from "./providers/resend.provider.js";
import {
  logSmtpSafeConfig,
  sendViaSmtp,
  verifySmtpProvider,
} from "./providers/smtp.provider.js";
import { resolveEmailFrom } from "./resolve-from.js";
import { EMAIL_USER_MESSAGES } from "./types.js";
import type { EmailPayload } from "./types.js";

export { resolveEmailFrom } from "./resolve-from.js";
export type { EmailErrorCode, EmailPayload } from "./types.js";
export { EMAIL_USER_MESSAGES } from "./types.js";

function logEmailProviderConfig(): void {
  console.log("[Email] Provider configuration:");
  console.log(`  EMAIL_PROVIDER=${env.EMAIL_PROVIDER}`);
  console.log(`  EMAIL_FROM=${resolveEmailFrom()}`);

  if (env.EMAIL_PROVIDER === "resend") {
    logResendSafeConfig();
  } else {
    logSmtpSafeConfig();
  }
}

function assertProviderConfigured(): void {
  if (isEmailProviderConfigured) {
    return;
  }

  const missing =
    env.EMAIL_PROVIDER === "resend"
      ? "RESEND_API_KEY"
      : "SMTP_HOST, SMTP_USER, SMTP_PASS";

  console.error(`[Email] provider not configured (missing: ${missing})`);
  throw ApiError.internal(
    EMAIL_USER_MESSAGES.EMAIL_PROVIDER_NOT_CONFIGURED,
    "EMAIL_PROVIDER_NOT_CONFIGURED",
  );
}

/** Verify active email provider at startup. */
export async function verifyEmailTransport(): Promise<boolean> {
  logEmailProviderConfig();

  if (!isEmailProviderConfigured) {
    console.error("[Email] verification result: FAILED (EMAIL_PROVIDER_NOT_CONFIGURED)");
    return false;
  }

  if (env.EMAIL_PROVIDER === "resend") {
    return verifyResendProvider();
  }

  return verifySmtpProvider();
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  if (!isEmailProviderConfigured) {
    if (env.NODE_ENV === "development" && env.MAIL_DEV_LOG) {
      const from = resolveEmailFrom();
      console.info("\n📧 [CognitiaX AI — Dev Email (provider not configured)]");
      console.info(`Provider: ${env.EMAIL_PROVIDER}`);
      console.info(`From: ${from}`);
      console.info(`To: ${payload.to}`);
      console.info(`Subject: ${payload.subject}`);
      console.info(`Body:\n${payload.text}\n`);
      return;
    }
    assertProviderConfigured();
  }

  if (env.EMAIL_PROVIDER === "resend") {
    await sendViaResend(payload);
    return;
  }

  await sendViaSmtp(payload);
}
