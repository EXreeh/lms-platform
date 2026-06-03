import nodemailer from "nodemailer";
import { env, isEmailConfigured } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";

let transporter: nodemailer.Transporter | null = null;

function smtpConfigSummary(): string {
  return [
    `host=${env.SMTP_HOST ?? "(not set)"}`,
    `port=${env.SMTP_PORT}`,
    `secure=${env.SMTP_SECURE}`,
    `user=${env.SMTP_USER ?? "(not set)"}`,
    `from=${env.EMAIL_FROM}`,
  ].join(", ");
}

function createSmtpTransporter(): nodemailer.Transporter {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    ...(env.SMTP_PORT === 587 && !env.SMTP_SECURE ? { requireTLS: true } : {}),
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
}

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (!isEmailConfigured) {
      transporter = nodemailer.createTransport({ jsonTransport: true });
    } else {
      transporter = createSmtpTransporter();
    }
  }
  return transporter;
}

/** Verify SMTP credentials at startup (Gmail app password, etc.) */
export async function verifyEmailTransport(): Promise<void> {
  console.log(`📧 SMTP config: ${smtpConfigSummary()}`);

  if (!isEmailConfigured) {
    if (env.NODE_ENV === "production") {
      console.error(
        "❌ SMTP not configured in production — OTP emails will fail. Set SMTP_HOST, SMTP_USER, SMTP_PASS.",
      );
    } else {
      console.warn("⚠️  SMTP not configured — OTP emails will be logged to console only.");
    }
    return;
  }

  try {
    await getTransporter().verify();
    console.log("✉️  SMTP verified successfully");
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`❌ SMTP verification failed: ${reason}`);
    console.error(
      "   Check SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS (Gmail App Password), and EMAIL_FROM.",
    );
  }
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const mail = {
    from: env.EMAIL_FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  };

  if (!isEmailConfigured) {
    if (env.NODE_ENV === "development" && env.MAIL_DEV_LOG) {
      console.info("\n📧 [CognitiaX AI — Dev Email (SMTP not configured)]");
      console.info(`To: ${params.to}`);
      console.info(`Subject: ${params.subject}`);
      console.info(`Body:\n${params.text}\n`);
      return;
    }
    throw ApiError.internal(
      "OTP email could not be sent. Please try again later.",
      "EMAIL_SEND_FAILED",
    );
  }

  console.log(`📧 Sending email → ${params.to} (${params.subject})`);

  try {
    const info = await getTransporter().sendMail(mail);
    console.log(`✉️  Email sent → ${params.to} (${info.messageId})`);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`❌ Email send failed → ${params.to}: ${reason}`);
    throw ApiError.internal(
      "OTP email could not be sent. Please try again later.",
      "EMAIL_SEND_FAILED",
    );
  }
}
