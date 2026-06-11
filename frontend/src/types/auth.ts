/** App-facing roles shown in UI. Legacy JWT may still carry OWNER — treated as ADMIN. */
export type AppRole = "STUDENT" | "TEACHER" | "ADMIN";

/** Includes legacy OWNER from existing tokens / database enum. */
export type Role = AppRole | "OWNER";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: AppRole;
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

export function displayRole(role: Role): AppRole {
  if (role === "OWNER") return "ADMIN";
  return role;
}

export const DASHBOARD_PATHS: Record<Role, string> = {
  STUDENT: "/dashboard/student",
  TEACHER: "/dashboard/teacher",
  ADMIN: "/dashboard/admin",
  OWNER: "/dashboard/admin",
};
