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
  COOKIE_DOMAIN: z
    .string()
    .optional()
    .transform((v) => {
      const trimmed = v?.trim();
      return trimmed ? trimmed : undefined;
    }),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  /** Comma-separated allowed browser origins (credentials; no wildcards). */
  ALLOWED_ORIGINS: z.string().optional(),
  /** @deprecated Prefer ALLOWED_ORIGINS */
  CORS_ORIGIN: z.string().optional(),
  OTP_SECRET: z.string().min(16).default("cognitiax-otp-secret-key"),
  OTP_EXPIRES_MINUTES: z.coerce.number().default(5),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().default(60),
  OTP_MAX_SENDS_PER_HOUR: z.coerce.number().default(5),
  RESET_TOKEN_EXPIRES_IN: z.string().default("15m"),
  EMAIL_PROVIDER: z.enum(["smtp", "resend"]).default("smtp"),
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default("CognitiaX AI <admin@cognitiaxai.com>"),
  MAIL_DEV_LOG: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  STORAGE_PROVIDER: z.preprocess(
    (val) => {
      if (typeof val !== "string" || !val.trim()) return undefined;
      return val.trim().toLowerCase();
    },
    z.enum(["local", "s3", "r2"]).default("local"),
  ),
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
  R2_ENDPOINT: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
  SEED_DEMO_DATA: z
    .string()
    .optional()
    .transform((v) => v === "true"),
}).superRefine((data, ctx) => {
  const weakJwtPatterns = ["changeme", "your-secret", "jwt-secret", "supersecret", "password"];
  if (data.NODE_ENV === "production") {
    const jwtLower = data.JWT_SECRET.toLowerCase();
    if (weakJwtPatterns.some((p) => jwtLower.includes(p)) || data.JWT_SECRET.length < 48) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "JWT_SECRET must be a strong unique value in production (min 48 chars)",
        path: ["JWT_SECRET"],
      });
    }
    if (data.OTP_SECRET === "cognitiax-otp-secret-key") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "OTP_SECRET must be changed in production",
        path: ["OTP_SECRET"],
      });
    }
    if (data.STORAGE_PROVIDER !== "r2") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "STORAGE_PROVIDER must be r2 in production",
        path: ["STORAGE_PROVIDER"],
      });
    }
    if (!data.ALLOWED_ORIGINS?.trim() && !data.CORS_ORIGIN?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ALLOWED_ORIGINS is required in production",
        path: ["ALLOWED_ORIGINS"],
      });
    }
  }

  if (data.STORAGE_PROVIDER === "r2") {
    const required: (keyof typeof data)[] = [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET",
      "R2_PUBLIC_URL",
    ];
    for (const key of required) {
      const value = data[key];
      if (typeof value !== "string" || !value.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${key} is required when STORAGE_PROVIDER=r2`,
          path: [key],
        });
      }
    }
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

console.log("[env] storage configuration", {
  STORAGE_PROVIDER_raw: process.env.STORAGE_PROVIDER ?? "(unset)",
  STORAGE_PROVIDER: env.STORAGE_PROVIDER,
  R2_PUBLIC_URL: env.R2_PUBLIC_URL ?? "(unset)",
  R2_BUCKET: env.R2_BUCKET ?? "(unset)",
  STORAGE_PUBLIC_URL: env.STORAGE_PUBLIC_URL,
});

function parseOriginList(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

/** Exact origins for CORS (credentials). FRONTEND_URL is always included. */
const PRODUCTION_CORS_ORIGINS = [
  "https://www.cognitiaxai.com",
  "https://lmsplatform-mu.vercel.app",
];

export const corsOrigins = Array.from(
  new Set([
    ...parseOriginList(env.ALLOWED_ORIGINS),
    ...parseOriginList(env.CORS_ORIGIN),
    env.FRONTEND_URL.trim().replace(/\/$/, ""),
    ...(env.NODE_ENV === "production" ? PRODUCTION_CORS_ORIGINS : []),
    ...(env.NODE_ENV === "development" ? ["http://localhost:3000", "http://127.0.0.1:3000"] : []),
  ].filter(Boolean)),
);

export const isSmtpConfigured = Boolean(
  env.SMTP_HOST?.trim() && env.SMTP_USER?.trim() && env.SMTP_PASS?.trim(),
);

export const isResendConfigured = Boolean(env.RESEND_API_KEY?.trim());

export const isEmailProviderConfigured =
  env.EMAIL_PROVIDER === "resend" ? isResendConfigured : isSmtpConfigured;

/** @deprecated Use isEmailProviderConfigured */
export const isEmailConfigured = isEmailProviderConfigured;
export const isRazorpayConfigured = Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
