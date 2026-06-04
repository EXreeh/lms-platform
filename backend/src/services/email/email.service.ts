import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";
import { env, isEmailConfigured } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";

let transporter: nodemailer.Transporter | null = null;

export type EmailErrorCode =
  | "SMTP_AUTH_FAILED"
  | "SMTP_CONNECTION_FAILED"
  | "EMAIL_SEND_FAILED";

interface ClassifiedEmailError {
  code: EmailErrorCode;
  message: string;
  logReason: string;
}

/** Use CognitiaX AI <SMTP_USER> so Gmail accepts the From address. */
export function resolveEmailFrom(): string {
  const user = env.SMTP_USER?.trim();
  const configured = env.EMAIL_FROM?.trim();

  if (configured && user && configured.includes(user)) {
    return configured;
  }
  if (user) {
    return `CognitiaX AI <${user}>`;
  }
  return configured || "CognitiaX AI <noreply@cognitiax.ai>";
}

function logSmtpConfig(): void {
  console.log("[SMTP] Configuration:");
  console.log(`  SMTP_HOST=${env.SMTP_HOST ?? "(not set)"}`);
  console.log(`  SMTP_PORT=${env.SMTP_PORT}`);
  console.log(`  SMTP_SECURE=${env.SMTP_SECURE}`);
  console.log(`  SMTP_USER=${env.SMTP_USER ?? "(not set)"}`);
  console.log(`  EMAIL_FROM=${resolveEmailFrom()}`);
  console.log(`  requireTLS=${env.SMTP_PORT === 587 && !env.SMTP_SECURE}`);
}

function createSmtpTransporter(): nodemailer.Transporter {
  const options: SMTPTransport.Options = {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  };

  // Gmail / port 587: STARTTLS (secure=false, requireTLS=true)
  if (env.SMTP_PORT === 587 && !env.SMTP_SECURE) {
    options.requireTLS = true;
  }

  return nodemailer.createTransport(options);
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

function classifySmtpError(error: unknown): ClassifiedEmailError {
  const err = error as {
    code?: string;
    responseCode?: number;
    message?: string;
  };
  const msg = err?.message ?? String(error);
  const lower = msg.toLowerCase();

  if (
    err?.code === "EAUTH" ||
    err?.responseCode === 535 ||
    err?.responseCode === 534 ||
    lower.includes("invalid login") ||
    lower.includes("authentication failed") ||
    lower.includes("username and password not accepted") ||
    lower.includes("bad credentials")
  ) {
    return {
      code: "SMTP_AUTH_FAILED",
      message:
        "Email authentication failed. Verify SMTP_USER and SMTP_PASS (Gmail App Password) on the server.",
      logReason: msg,
    };
  }

  if (
    err?.code === "ECONNREFUSED" ||
    err?.code === "ETIMEDOUT" ||
    err?.code === "ENOTFOUND" ||
    err?.code === "ESOCKET" ||
    err?.code === "ECONNRESET" ||
    lower.includes("connect") ||
    lower.includes("timeout") ||
    lower.includes("getaddrinfo") ||
    lower.includes("greeting never received")
  ) {
    return {
      code: "SMTP_CONNECTION_FAILED",
      message: "Could not connect to the email server. Please try again later.",
      logReason: msg,
    };
  }

  return {
    code: "EMAIL_SEND_FAILED",
    message: "OTP email could not be sent. Please try again later.",
    logReason: msg,
  };
}

function throwEmailApiError(error: unknown): never {
  const classified = classifySmtpError(error);
  console.error(`[SMTP] ${classified.code}: ${classified.logReason}`);
  throw ApiError.internal(classified.message, classified.code);
}

/** Verify SMTP at startup. Logs SMTP ready or SMTP failed with reason. */
export async function verifyEmailTransport(): Promise<boolean> {
  logSmtpConfig();

  if (!isEmailConfigured) {
    const missing = [
      !env.SMTP_HOST && "SMTP_HOST",
      !env.SMTP_USER && "SMTP_USER",
      !env.SMTP_PASS && "SMTP_PASS",
    ]
      .filter(Boolean)
      .join(", ");
    console.error(`[SMTP] SMTP failed: not configured (missing: ${missing || "unknown"})`);
    return false;
  }

  try {
    await getTransporter().verify();
    console.log("[SMTP] SMTP ready");
    return true;
  } catch (error) {
    const { logReason } = classifySmtpError(error);
    console.error(`[SMTP] SMTP failed: ${logReason}`);
    return false;
  }
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const from = resolveEmailFrom();
  const mail = {
    from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  };

  if (!isEmailConfigured) {
    if (env.NODE_ENV === "development" && env.MAIL_DEV_LOG) {
      console.info("\n📧 [CognitiaX AI — Dev Email (SMTP not configured)]");
      console.info(`From: ${from}`);
      console.info(`To: ${params.to}`);
      console.info(`Subject: ${params.subject}`);
      console.info(`Body:\n${params.text}\n`);
      return;
    }
    throw ApiError.internal(
      "OTP email could not be sent. Email service is not configured.",
      "EMAIL_SEND_FAILED",
    );
  }

  console.log(`[SMTP] OTP email send started → ${params.to} (${params.subject})`);

  try {
    const info = await getTransporter().sendMail(mail);
    console.log(`[SMTP] OTP email sent → ${params.to} (${info.messageId ?? "ok"})`);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throwEmailApiError(error);
  }
}
