export type Role = "STUDENT" | "TEACHER" | "ADMIN";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    token: string;
  };
}

export interface MeResponse {
  success: boolean;
  data: {
    user: User;
  };
}

export interface EmailCheckResponse {
  success: boolean;
  data: {
    available: boolean;
  };
}

export interface OtpMessageResponse {
  success: boolean;
  message: string;
}

export interface PasswordResetVerifyResponse {
  success: boolean;
  data: {
    resetToken: string;
    message: string;
  };
}

export const DASHBOARD_PATHS: Record<Role, string> = {
  STUDENT: "/dashboard/student",
  TEACHER: "/dashboard/teacher",
  ADMIN: "/dashboard/admin",
};
