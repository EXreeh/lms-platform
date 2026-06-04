import { createHmac, randomInt } from "node:crypto";
import type { OtpPurpose } from "@lms/database";
import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";

function hashOtp(code: string): string {
  return createHmac("sha256", env.OTP_SECRET).update(code).digest("hex");
}

function generateOtpCode(): string {
  return String(randomInt(100000, 999999));
}

export async function assertOtpRateLimit(email: string, purpose: OtpPurpose): Promise<void> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.otpChallenge.count({
    where: {
      email,
      purpose,
      createdAt: { gte: oneHourAgo },
    },
  });

  if (recentCount >= env.OTP_MAX_SENDS_PER_HOUR) {
    throw ApiError.tooManyRequests(
      "Too many OTP requests. Please try again later.",
      "OTP_RATE_LIMIT",
    );
  }

  const cooldownStart = new Date(Date.now() - env.OTP_RESEND_COOLDOWN_SECONDS * 1000);
  const recentSend = await prisma.otpChallenge.findFirst({
    where: {
      email,
      purpose,
      createdAt: { gte: cooldownStart },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recentSend) {
    throw ApiError.tooManyRequests(
      `Please wait ${env.OTP_RESEND_COOLDOWN_SECONDS} seconds before requesting another code.`,
      "OTP_COOLDOWN",
    );
  }
}

export async function createAndSendOtp(params: {
  email: string;
  purpose: OtpPurpose;
  send: (otp: string) => Promise<void>;
}): Promise<void> {
  await assertOtpRateLimit(params.email, params.purpose);

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRES_MINUTES * 60 * 1000);

  const challenge = await prisma.otpChallenge.create({
    data: {
      email: params.email,
      purpose: params.purpose,
      codeHash: hashOtp(code),
      expiresAt,
    },
  });

  console.log(`[OTP] send started (${params.purpose}) → ${params.email}`);

  try {
    await params.send(code);
    console.log(`[OTP] send succeeded (${params.purpose}) → ${params.email}`);
  } catch (error) {
    await prisma.otpChallenge.delete({ where: { id: challenge.id } }).catch(() => undefined);
    if (error instanceof ApiError) {
      console.error(
        `[OTP] send failed (${params.purpose}) → ${params.email}: ${error.code ?? "ERROR"} — ${error.message}`,
      );
      throw error;
    }
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[OTP] send failed (${params.purpose}) → ${params.email}: ${reason}`);
    throw error;
  }
}

export async function verifyOtp(params: {
  email: string;
  purpose: OtpPurpose;
  code: string;
}): Promise<void> {
  const challenge = await prisma.otpChallenge.findFirst({
    where: {
      email: params.email,
      purpose: params.purpose,
      verified: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!challenge) {
    throw ApiError.badRequest("OTP expired or not found. Request a new code.", "OTP_INVALID");
  }

  if (challenge.attempts >= env.OTP_MAX_ATTEMPTS) {
    throw ApiError.badRequest("Too many failed attempts. Request a new code.", "OTP_MAX_ATTEMPTS");
  }

  const isValid = hashOtp(params.code) === challenge.codeHash;

  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { attempts: { increment: 1 } },
  });

  if (!isValid) {
    throw ApiError.badRequest("Invalid verification code", "OTP_WRONG");
  }

  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { verified: true },
  });
}
