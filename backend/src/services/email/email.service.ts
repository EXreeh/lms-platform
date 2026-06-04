import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";
import { env, isEmailConfigured } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";

let transporter: nodemailer.Transporter | null = null;

export type EmailErrorCode =
  | "SMTP_AUTH_FAILED"
  | "SMTP_CONNECTION_FAILED"
  | "EMAIL_SEND_FAILED";

/** Safe user-facing messages returned in API responses (no secrets). */
export const EMAIL_USER_MESSAGES: Record<EmailErrorCode, string> = {
  SMTP_AUTH_FAILED: "Email authentication failed. Please contact support.",
  SMTP_CONNECTION_FAILED:
    "We could not reach the mail server. Please try again in a few minutes.",
  EMAIL_SEND_FAILED: "OTP email could not be sent. Please try again later.",
};

interface ClassifiedEmailError {
  code: EmailErrorCode;
  message: string;
}

type NodemailerErrorLike = {
  code?: string;
  responseCode?: number;
  command?: string;
  response?: string;
  message?: string;
};

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
  console.log("[SMTP] Safe configuration (no password):");
  console.log(`  SMTP_HOST=${env.SMTP_HOST ?? "(not set)"}`);
  console.log(`  SMTP_PORT=${env.SMTP_PORT}`);
  console.log(`  SMTP_SECURE=${env.SMTP_SECURE}`);
  console.log(`  SMTP_USER=${env.SMTP_USER ?? "(not set)"}`);
  console.log(`  EMAIL_FROM=${resolveEmailFrom()}`);
  console.log(`  requireTLS=${env.SMTP_PORT === 587 && !env.SMTP_SECURE}`);
}

/** Log exact Nodemailer fields for Railway debugging — never logs SMTP_PASS. */
export function logNodemailerError(context: string, error: unknown): void {
  const err = error as NodemailerErrorLike;
  console.error(`[SMTP] ${context} — Nodemailer error details:`);
  console.error(`  code=${err.code ?? "(none)"}`);
  console.error(`  responseCode=${err.responseCode ?? "(none)"}`);
  console.error(`  command=${err.command ?? "(none)"}`);
  console.error(`  message=${err.message ?? String(error)}`);
  if (err.response) {
    const response = String(err.response).replace(/\s+/g, " ").trim();
    console.error(`  response=${response.slice(0, 400)}`);
  }
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

export function classifySmtpError(error: unknown): ClassifiedEmailError {
  const err = error as NodemailerErrorLike;
  const code = err.code?.toUpperCase();
  const responseCode = err.responseCode;
  const msg = err.message ?? String(error);
  const lower = msg.toLowerCase();

  if (
    code === "EAUTH" ||
    responseCode === 535 ||
    responseCode === 534 ||
    lower.includes("invalid login") ||
    lower.includes("authentication failed") ||
    lower.includes("username and password not accepted")
  ) {
    return { code: "SMTP_AUTH_FAILED", message: EMAIL_USER_MESSAGES.SMTP_AUTH_FAILED };
  }

  if (
    code === "ECONNECTION" ||
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT" ||
    code === "ENOTFOUND" ||
    code === "ESOCKET" ||
    code === "ECONNRESET" ||
    code === "ETIMEOUT" ||
    lower.includes("connect") ||
    lower.includes("timeout") ||
    lower.includes("getaddrinfo") ||
    lower.includes("greeting never received")
  ) {
    return {
      code: "SMTP_CONNECTION_FAILED",
      message: EMAIL_USER_MESSAGES.SMTP_CONNECTION_FAILED,
    };
  }

  return { code: "EMAIL_SEND_FAILED", message: EMAIL_USER_MESSAGES.EMAIL_SEND_FAILED };
}

function throwEmailApiError(error: unknown): never {
  logNodemailerError("send failed", error);
  const classified = classifySmtpError(error);
  console.error(`[SMTP] mapped error code=${classified.code}`);
  throw ApiError.internal(classified.message, classified.code);
}

/** Verify SMTP at startup; logs config + verification SUCCESS or FAILED. */
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
    console.error(`[SMTP] verification result: FAILED (not configured — missing: ${missing})`);
    return false;
  }

  try {
    await getTransporter().verify();
    console.log("[SMTP] verification result: SUCCESS");
    console.log("[SMTP] SMTP ready — transport verified");
    return true;
  } catch (error) {
    logNodemailerError("verification failed", error);
    const classified = classifySmtpError(error);
    console.error(`[SMTP] verification result: FAILED (mapped=${classified.code})`);
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
      EMAIL_USER_MESSAGES.EMAIL_SEND_FAILED,
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
