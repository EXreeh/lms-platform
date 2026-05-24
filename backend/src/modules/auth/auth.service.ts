import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import { signToken } from "../../utils/jwt.js";
import { signResetToken, verifyResetToken } from "../../utils/reset-token.js";
import { sendEmail } from "../../services/email/email.service.js";
import { otpVerificationEmail } from "../../services/email/templates/otp-verification.js";
import { passwordResetEmail } from "../../services/email/templates/password-reset.js";
import { createAndSendOtp, verifyOtp } from "../otp/otp.service.js";
import { publicUserSelect, toPublicUser, type PublicUser } from "./auth.mapper.js";
import type {
  LoginInput,
  RegisterRequestOtpInput,
  VerifyOtpInput,
} from "./auth.validation.js";

const PENDING_REG_TTL_MS = env.OTP_EXPIRES_MINUTES * 60 * 1000 + 5 * 60 * 1000;

export async function checkEmailAvailability(email: string): Promise<{ available: boolean }> {
  const existing = await prisma.user.findUnique({ where: { email } });
  return { available: !existing };
}

export async function requestRegistrationOtp(input: RegisterRequestOtpInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.conflict("Email already registered", "EMAIL_EXISTS");
  }

  const passwordHash = await hashPassword(input.password);
  const expiresAt = new Date(Date.now() + PENDING_REG_TTL_MS);

  await prisma.pendingRegistration.upsert({
    where: { email: input.email },
    create: {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      passwordHash,
      expiresAt,
    },
    update: {
      firstName: input.firstName,
      lastName: input.lastName,
      passwordHash,
      expiresAt,
    },
  });

  await createAndSendOtp({
    email: input.email,
    purpose: "REGISTER",
    send: async (otp) => {
      const template = otpVerificationEmail({
        firstName: input.firstName,
        otp,
        expiresMinutes: env.OTP_EXPIRES_MINUTES,
      });
      await sendEmail({
        to: input.email,
        ...template,
      });
    },
  });

  return { message: "Verification code sent to your email" };
}

export async function resendRegistrationOtp(email: string) {
  const pending = await prisma.pendingRegistration.findUnique({ where: { email } });
  if (!pending || pending.expiresAt < new Date()) {
    throw ApiError.badRequest(
      "Registration session expired. Please start again.",
      "PENDING_EXPIRED",
    );
  }

  await createAndSendOtp({
    email,
    purpose: "REGISTER",
    send: async (otp) => {
      const template = otpVerificationEmail({
        firstName: pending.firstName,
        otp,
        expiresMinutes: env.OTP_EXPIRES_MINUTES,
      });
      await sendEmail({ to: email, ...template });
    },
  });

  return { message: "Verification code resent" };
}

export async function verifyRegistrationOtp(input: VerifyOtpInput) {
  const pending = await prisma.pendingRegistration.findUnique({
    where: { email: input.email },
  });

  if (!pending || pending.expiresAt < new Date()) {
    throw ApiError.badRequest(
      "Registration session expired. Please start again.",
      "PENDING_EXPIRED",
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.conflict("Email already registered", "EMAIL_EXISTS");
  }

  await verifyOtp({ email: input.email, purpose: "REGISTER", code: input.otp });

  const user = await prisma.user.create({
    data: {
      firstName: pending.firstName,
      lastName: pending.lastName,
      email: pending.email,
      password: pending.passwordHash,
      role: "STUDENT",
      emailVerified: true,
    },
    select: publicUserSelect,
  });

  await prisma.pendingRegistration.delete({ where: { email: input.email } });

  const publicUser = toPublicUser(user);
  const token = signToken({ sub: user.id, email: user.email, role: user.role });

  return { user: publicUser, token };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    throw ApiError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
  }

  const valid = await comparePassword(input.password, user.password);

  if (!valid) {
    throw ApiError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
  }

  const token = signToken({ sub: user.id, email: user.email, role: user.role });

  return { user: toPublicUser(user), token };
}

export async function getProfile(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return toPublicUser(user);
}

export async function requestPasswordResetOtp(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    await createAndSendOtp({
      email,
      purpose: "PASSWORD_RESET",
      send: async (otp) => {
        const template = passwordResetEmail({
          otp,
          expiresMinutes: env.OTP_EXPIRES_MINUTES,
        });
        await sendEmail({ to: email, ...template });
      },
    });
  }

  return {
    message: "If an account exists for this email, a verification code has been sent.",
  };
}

export async function resendPasswordResetOtp(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { message: "If an account exists for this email, a verification code has been sent." };
  }

  await createAndSendOtp({
    email,
    purpose: "PASSWORD_RESET",
    send: async (otp) => {
      const template = passwordResetEmail({
        otp,
        expiresMinutes: env.OTP_EXPIRES_MINUTES,
      });
      await sendEmail({ to: email, ...template });
    },
  });

  return { message: "Verification code resent" };
}

export async function verifyPasswordResetOtp(input: VerifyOtpInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw ApiError.badRequest("Invalid verification code", "OTP_INVALID");
  }

  await verifyOtp({ email: input.email, purpose: "PASSWORD_RESET", code: input.otp });

  const resetToken = signResetToken(input.email);

  return { resetToken, message: "Verification successful. You may reset your password." };
}

export async function resetPassword(resetToken: string, password: string) {
  const payload = verifyResetToken(resetToken);
  const user = await prisma.user.findUnique({ where: { email: payload.email } });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: passwordHash },
  });

  return { message: "Password updated successfully" };
}
