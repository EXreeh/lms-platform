import { config } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), "../database/.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_COOKIE_NAME: z.string().default("cognitiax_token"),
  COOKIE_SECURE: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  COOKIE_SAME_SITE: z.enum(["strict", "lax", "none"]).default("lax"),
  COOKIE_DOMAIN: z.string().optional(),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  CORS_ORIGIN: z.string().optional(),
  OTP_SECRET: z.string().min(16).default("cognitiax-otp-secret-key"),
  OTP_EXPIRES_MINUTES: z.coerce.number().default(5),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().default(60),
  OTP_MAX_SENDS_PER_HOUR: z.coerce.number().default(5),
  RESET_TOKEN_EXPIRES_IN: z.string().default("15m"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default("CognitiaX AI <noreply@cognitiax.ai>"),
  MAIL_DEV_LOG: z
    .string()
    .transform((v) => v === "true")
    .default("true"),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  STORAGE_PROVIDER: z.enum(["local", "s3", "r2"]).default("local"),
  UPLOADS_DIR: z.string().default("uploads"),
  STORAGE_PUBLIC_URL: z.string().default("/uploads"),
  MAX_VIDEO_UPLOAD_MB: z.coerce.number().default(500),
  MAX_RESOURCE_UPLOAD_MB: z.coerce.number().default(50),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

/** Comma-separated origins; FRONTEND_URL is always included. */
export const corsOrigins = Array.from(
  new Set(
    [...(env.CORS_ORIGIN ?? "").split(","), env.FRONTEND_URL]
      .map((origin) => origin.trim().replace(/\/$/, ""))
      .filter(Boolean),
  ),
);

export const isEmailConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
export const isRazorpayConfigured = Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
