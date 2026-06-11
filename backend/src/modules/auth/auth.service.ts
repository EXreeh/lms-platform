import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import { signToken } from "../../utils/jwt.js";
import { signResetToken, verifyResetToken } from "../../utils/reset-token.js";
import { sendEmail } from "../../services/email/email.service.js";
import { passwordResetEmail } from "../../services/email/templates/password-reset.js";
import { createAndSendOtp, verifyOtp } from "../otp/otp.service.js";
import { logActivity } from "../admin/activity.service.js";
import { logAudit } from "../audit/audit.service.js";
import { publicUserSelect, toPublicUser, type PublicUser } from "./auth.mapper.js";
import type {
  LoginInput,
  RegisterRequestOtpInput,
  VerifyOtpInput,
} from "./auth.validation.js";

const SELF_REGISTRATION_MESSAGE =
  "Public registration is disabled. Contact your institute administrator to create an account.";

function assertSelfRegistrationDisabled(): never {
  throw ApiError.forbidden(SELF_REGISTRATION_MESSAGE, "SELF_REGISTRATION_DISABLED");
}

export async function checkEmailAvailability(email: string): Promise<{ available: boolean }> {
  const existing = await prisma.user.findUnique({ where: { email } });
  return { available: !existing };
}

export async function requestRegistrationOtp(_input: RegisterRequestOtpInput): Promise<never> {
  return assertSelfRegistrationDisabled();
}

export async function resendRegistrationOtp(_email: string): Promise<never> {
  return assertSelfRegistrationDisabled();
}

export async function verifyRegistrationOtp(_input: VerifyOtpInput): Promise<never> {
  return assertSelfRegistrationDisabled();
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    throw ApiError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
  }

  if (user.suspended) {
    throw ApiError.forbidden("Your account has been suspended. Contact support.", "ACCOUNT_SUSPENDED");
  }

  const valid = await comparePassword(input.password, user.password);

  if (!valid) {
    throw ApiError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await logActivity({
    type: "LOGIN",
    userId: user.id,
    metadata: { email: user.email },
  });
  await logAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "USER_LOGIN",
    entityType: "user",
    entityId: user.id,
    metadata: { email: user.email },
  });

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

export async function getAccountProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });
  if (!user) throw ApiError.notFound("User not found");

  const profile = toPublicUser(user);
  let stats: Record<string, number> = {};

  if (user.role === "STUDENT") {
    const [enrolled, completed, certificates, quizAttempts] = await Promise.all([
      prisma.enrollment.count({ where: { studentId: userId } }),
      prisma.enrollment.count({ where: { studentId: userId, completed: true } }),
      prisma.certificate.count({ where: { studentId: userId } }),
      prisma.quizAttempt.count({
        where: { studentId: userId, completedAt: { not: null } },
      }),
    ]);
    stats = {
      enrolledCourses: enrolled,
      completedCourses: completed,
      certificates,
      quizAttempts,
    };
  } else if (user.role === "TEACHER") {
    const [courses, enrollments, resources, quizzes] = await Promise.all([
      prisma.course.count({ where: { teacherId: userId, deleteStatus: { not: "DELETED" } } }),
      prisma.enrollment.count({ where: { course: { teacherId: userId } } }),
      prisma.resource.count({ where: { uploadedById: userId, deleteStatus: { not: "DELETED" } } }),
      prisma.quiz.count({
        where: {
          deleteStatus: { not: "DELETED" },
          lesson: { module: { course: { teacherId: userId } } },
        },
      }),
    ]);
    stats = { courses, totalEnrollments: enrollments, resources, quizzes };
  } else if (user.role === "ADMIN") {
    const [students, teachers, courses, enrollments] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT", suspended: false } }),
      prisma.user.count({ where: { role: "TEACHER", suspended: false } }),
      prisma.course.count({ where: { deleteStatus: "ACTIVE", status: { not: "ARCHIVED" } } }),
      prisma.enrollment.count(),
    ]);
    stats = { students, teachers, courses, enrollments };
  }

  return {
    user: {
      ...profile,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    },
    stats,
  };
}

export async function updateProfile(userId: string, input: { firstName: string; lastName: string }) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
    },
    select: publicUserSelect,
  });

  const profile = toPublicUser(user);
  return {
    user: {
      ...profile,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    },
    message: "Profile updated successfully",
  };
}

export async function changePassword(
  userId: string,
  input: { currentPassword: string; newPassword: string },
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("User not found");

  const valid = await comparePassword(input.currentPassword, user.password);
  if (!valid) {
    throw ApiError.badRequest("Current password is incorrect", "INVALID_PASSWORD");
  }

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: passwordHash },
  });

  return { message: "Password changed successfully" };
}
