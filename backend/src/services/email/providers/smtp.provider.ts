import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";
import { env, isSmtpConfigured } from "../../../config/env.js";
import { ApiError } from "../../../utils/api-error.js";
import { resolveEmailFrom } from "../resolve-from.js";
import type { EmailPayload } from "../types.js";
import { EMAIL_USER_MESSAGES } from "../types.js";

let transporter: nodemailer.Transporter | null = null;

type NodemailerErrorLike = {
  code?: string;
  responseCode?: number;
  command?: string;
  response?: string;
  message?: string;
};

function logNodemailerError(context: string, error: unknown): void {
  const err = error as NodemailerErrorLike;
  console.error(`[Email/SMTP] ${context} — Nodemailer error details:`);
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
    transporter = isSmtpConfigured
      ? createSmtpTransporter()
      : nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

function classifySmtpError(error: unknown): {
  code: keyof typeof EMAIL_USER_MESSAGES | "SMTP_CONNECTION_FAILED";
  message: string;
} {
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
    lower.includes("authentication failed")
  ) {
    return {
      code: "EMAIL_AUTH_FAILED",
      message: EMAIL_USER_MESSAGES.EMAIL_AUTH_FAILED,
    };
  }

  if (
    code === "ECONNECTION" ||
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT" ||
    code === "ENOTFOUND" ||
    code === "ESOCKET" ||
    lower.includes("connect") ||
    lower.includes("timeout")
  ) {
    return {
      code: "EMAIL_SEND_FAILED",
      message: EMAIL_USER_MESSAGES.EMAIL_SEND_FAILED,
    };
  }

  return {
    code: "EMAIL_SEND_FAILED",
    message: EMAIL_USER_MESSAGES.EMAIL_SEND_FAILED,
  };
}

export function logSmtpSafeConfig(): void {
  console.log("[Email/SMTP] Safe configuration:");
  console.log(`  SMTP_HOST=${env.SMTP_HOST ?? "(not set)"}`);
  console.log(`  SMTP_PORT=${env.SMTP_PORT}`);
  console.log(`  SMTP_SECURE=${env.SMTP_SECURE}`);
  console.log(`  SMTP_USER=${env.SMTP_USER ?? "(not set)"}`);
  console.log(`  requireTLS=${env.SMTP_PORT === 587 && !env.SMTP_SECURE}`);
}

export async function verifySmtpProvider(): Promise<boolean> {
  logSmtpSafeConfig();

  if (!isSmtpConfigured) {
    console.error(
      "[Email/SMTP] verification result: FAILED (missing SMTP_HOST, SMTP_USER, or SMTP_PASS)",
    );
    return false;
  }

  try {
    await getTransporter().verify();
    console.log("[Email/SMTP] verification result: SUCCESS");
    return true;
  } catch (error) {
    logNodemailerError("verification failed", error);
    const classified = classifySmtpError(error);
    console.error(`[Email/SMTP] verification result: FAILED (mapped=${classified.code})`);
    return false;
  }
}

export async function sendViaSmtp(payload: EmailPayload): Promise<void> {
  const from = resolveEmailFrom();
  const mail = { from, to: payload.to, subject: payload.subject, html: payload.html, text: payload.text };

  console.log(`[Email/SMTP] send started → ${payload.to} (${payload.subject})`);

  try {
    const info = await getTransporter().sendMail(mail);
    console.log(`[Email/SMTP] send succeeded → ${payload.to} (${info.messageId ?? "ok"})`);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logNodemailerError("send failed", error);
    const classified = classifySmtpError(error);
    console.error(`[Email/SMTP] mapped error code=${classified.code}`);
    throw ApiError.internal(classified.message, classified.code);
  }
}
