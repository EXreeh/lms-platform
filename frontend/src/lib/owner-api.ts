import { apiRequest } from "./api";
import type { AdminUser, ListUsersParams, Pagination } from "@/types/admin";

export function fetchOwnerUsers(params: ListUsersParams = {}) {
  return apiRequest<{ success: boolean; data: { users: AdminUser[]; pagination: Pagination } }>(
    `/owner/users${queryString(params as Record<string, string | number | boolean | undefined>)}`,
    { auth: true },
  );
}

export function fetchOwnerAdmins() {
  return apiRequest<{ success: boolean; data: AdminUser[] }>("/owner/admins", { auth: true });
}

export function fetchOwnerAuditLogs(params: { page?: number; limit?: number; action?: string } = {}) {
  return apiRequest<{
    success: boolean;
    data: {
      logs: Array<{
        id: string;
        action: string;
        actorId: string | null;
        actorRole: string | null;
        entityType: string | null;
        entityId: string | null;
        metadata: unknown;
        ipAddress: string | null;
        createdAt: string;
      }>;
      pagination: Pagination;
    };
  }>(`/owner/audit-logs${queryString(params)}`, { auth: true });
}

export function fetchOwnerSecurity() {
  return apiRequest<{
    success: boolean;
    data: {
      nodeEnv: string;
      storageProvider: string;
      jwtConfigured: boolean;
      r2Configured: boolean;
      demoSeedDisabled: boolean;
    };
  }>("/owner/security", { auth: true });
}

export function fetchOwnerLoginHistory() {
  return apiRequest<{ success: boolean; data: unknown[] }>("/owner/login-history", { auth: true });
}

function queryString(params: Record<string, string | number | boolean | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}
