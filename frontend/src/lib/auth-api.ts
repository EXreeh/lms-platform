import type {
  AuthResponse,
  EmailCheckResponse,
  MeResponse,
  OtpMessageResponse,
  PasswordResetVerifyResponse,
} from "@/types/auth";
import { apiRequest } from "./api";

/** Session check timeout — generous for cross-origin production /me calls. */
export const AUTH_ME_TIMEOUT_MS = 12_000;

export const AUTH_LOGIN_ME_TIMEOUT_MS = 15_000;

export class AuthMeTimeoutError extends Error {
  readonly name = "AuthMeTimeoutError";

  constructor() {
    super("Session check timed out");
  }
}

export interface RegisterRequestPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export function checkEmailAvailability(email: string) {
  return apiRequest<EmailCheckResponse>(
    `/auth/check-email?email=${encodeURIComponent(email)}`,
    { method: "GET" },
  );
}

export function requestRegistrationOtp(payload: RegisterRequestPayload) {
  return apiRequest<OtpMessageResponse>("/auth/register/request-otp", {
    method: "POST",
    body: payload,
    credentials: "include",
  });
}

export function resendRegistrationOtp(email: string) {
  return apiRequest<OtpMessageResponse>("/auth/register/resend-otp", {
    method: "POST",
    body: { email },
    credentials: "include",
  });
}

export function verifyRegistrationOtp(email: string, otp: string) {
  return apiRequest<AuthResponse>("/auth/register/verify", {
    method: "POST",
    body: { email, otp },
    credentials: "include",
  });
}

export function loginUser(payload: LoginPayload) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: payload,
    credentials: "include",
  });
}

export function logoutUser() {
  return apiRequest<{ success: boolean; message: string }>("/auth/logout", {
    method: "POST",
    auth: true,
    credentials: "include",
  });
}

export function fetchCurrentUser(options?: {
  bearerToken?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}) {
  const timeoutMs = options?.timeoutMs ?? AUTH_ME_TIMEOUT_MS;
  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  if (options?.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  return apiRequest<MeResponse>("/auth/me", {
    method: "GET",
    auth: true,
    bearerToken: options?.bearerToken,
    credentials: "include",
    signal: controller.signal,
  })
    .catch((error) => {
      if (timedOut) {
        throw new AuthMeTimeoutError();
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
      throw error;
    })
    .finally(() => {
      clearTimeout(timeoutId);
    });
}

export function fetchAccountProfile() {
  return apiRequest<{
    success: boolean;
    data: {
      user: {
        id: string;
        firstName: string;
        lastName: string;
        name: string;
        email: string;
        role: import("@/types/auth").Role;
        emailVerified: boolean;
        createdAt: string;
        updatedAt: string;
      };
      stats: Record<string, number>;
    };
  }>("/auth/account", { auth: true, credentials: "include" });
}

export function requestPasswordResetOtp(email: string) {
  return apiRequest<OtpMessageResponse>("/auth/password/forgot", {
    method: "POST",
    body: { email },
    credentials: "include",
  });
}

export function resendPasswordResetOtp(email: string) {
  return apiRequest<OtpMessageResponse>("/auth/password/resend-otp", {
    method: "POST",
    body: { email },
    credentials: "include",
  });
}

export function verifyPasswordResetOtp(email: string, otp: string) {
  return apiRequest<PasswordResetVerifyResponse>("/auth/password/verify-otp", {
    method: "POST",
    body: { email, otp },
    credentials: "include",
  });
}

export function resetPassword(payload: {
  resetToken: string;
  password: string;
  confirmPassword: string;
}) {
  return apiRequest<OtpMessageResponse>("/auth/password/reset", {
    method: "POST",
    body: payload,
    credentials: "include",
  });
}

export function updateAccountProfile(payload: { firstName: string; lastName: string }) {
  return apiRequest<{
    success: boolean;
    data: {
      user: {
        id: string;
        firstName: string;
        lastName: string;
        name: string;
        email: string;
        role: import("@/types/auth").Role;
        emailVerified: boolean;
        createdAt: string;
        updatedAt: string;
      };
      message: string;
    };
  }>("/auth/profile", {
    method: "PATCH",
    body: payload,
    auth: true,
    credentials: "include",
  });
}

export function changeAccountPassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  return apiRequest<{ success: boolean; message: string }>("/auth/password/change", {
    method: "POST",
    body: payload,
    auth: true,
    credentials: "include",
  });
}
