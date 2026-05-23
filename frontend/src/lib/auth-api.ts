import type { AuthResponse, MeResponse, Role } from "@/types/auth";
import { apiRequest } from "./api";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export function registerUser(payload: RegisterPayload) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: payload,
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
