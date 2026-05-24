import type {
  AuthResponse,
  EmailCheckResponse,
  MeResponse,
  OtpMessageResponse,
  PasswordResetVerifyResponse,
} from "@/types/auth";
import { apiRequest } from "./api";

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
  });
}

export function resendRegistrationOtp(email: string) {
  return apiRequest<OtpMessageResponse>("/auth/register/resend-otp", {
    method: "POST",
    body: { email },
  });
}

export function verifyRegistrationOtp(email: string, otp: string) {
  return apiRequest<AuthResponse>("/auth/register/verify", {
    method: "POST",
    body: { email, otp },
  });
}

export function loginUser(payload: LoginPayload) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function logoutUser() {
  return apiRequest<{ success: boolean; message: string }>("/auth/logout", {
    method: "POST",
    auth: true,
  });
}

export function fetchCurrentUser() {
  return apiRequest<MeResponse>("/auth/me", {
    method: "GET",
    auth: true,
  });
}

export function requestPasswordResetOtp(email: string) {
  return apiRequest<OtpMessageResponse>("/auth/password/forgot", {
    method: "POST",
    body: { email },
  });
}

export function resendPasswordResetOtp(email: string) {
  return apiRequest<OtpMessageResponse>("/auth/password/resend-otp", {
    method: "POST",
    body: { email },
  });
}

export function verifyPasswordResetOtp(email: string, otp: string) {
  return apiRequest<PasswordResetVerifyResponse>("/auth/password/verify-otp", {
    method: "POST",
    body: { email, otp },
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
  });
}
