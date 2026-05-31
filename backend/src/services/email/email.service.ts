import nodemailer from "nodemailer";
import { env, isEmailConfigured } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";

let transporter: nodemailer.Transporter | null = null;

function createSmtpTransporter(): nodemailer.Transporter {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    // Gmail on port 587 uses STARTTLS
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
  if (!isEmailConfigured) {
    console.warn("⚠️  SMTP not configured — OTP emails will be logged to console only.");
    return;
  }

  try {
    await getTransporter().verify();
    console.log(`✉️  Email ready (SMTP: ${env.SMTP_HOST}:${env.SMTP_PORT} as ${env.SMTP_USER})`);
  } catch (error) {
    console.error("❌ SMTP verification failed:", error);
    console.error(
      "   Check SMTP_USER, SMTP_PASS (Gmail App Password), and that 2FA + App Passwords are enabled.",
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
    if (env.MAIL_DEV_LOG || env.NODE_ENV === "development") {
      console.info("\n📧 [CognitiaX AI — Dev Email (SMTP not configured)]");
      console.info(`To: ${params.to}`);
      console.info(`Subject: ${params.subject}`);
      console.info(`Body:\n${params.text}\n`);
      return;
    }
    throw ApiError.internal("Email service is not configured");
  }

  try {
    const info = await getTransporter().sendMail(mail);
    if (env.NODE_ENV === "development") {
      console.info(`📧 Email sent → ${params.to} (${info.messageId})`);
    }
  } catch (error) {
    console.error("Failed to send email:", error);
    throw ApiError.internal(
      "Unable to send verification email. Please try again later.",
      "EMAIL_SEND_FAILED",
    );
  }
}
