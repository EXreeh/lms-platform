import type { MessageItem } from "@/types/institute";
import { apiRequest } from "./api";

export function fetchComposeTargets(params?: { search?: string; role?: string }) {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.role) qs.set("role", params.role);
  const q = qs.toString();
  return apiRequest<{
    success: boolean;
    data: {
      recipients: {
        id: string;
        name: string;
        email: string;
        role: string;
        batchName?: string;
      }[];
      batches: { id: string; name: string; status?: string }[];
      canBroadcastAllStudents: boolean;
      canBroadcastAllTeachers: boolean;
    };
  }>(`/messages/compose-targets${q ? `?${q}` : ""}`, { auth: true });
}

export function fetchUnreadCount() {
  return apiRequest<{ success: boolean; data: { count: number } }>(
    "/messages/unread-count",
    { auth: true },
  );
}

export function fetchInbox(unreadOnly?: boolean) {
  const q = unreadOnly ? "?unreadOnly=true" : "";
  return apiRequest<{ success: boolean; data: MessageItem[] }>(`/messages/inbox${q}`, {
    auth: true,
  });
}

export function fetchSentMessages() {
  return apiRequest<{ success: boolean; data: MessageItem[] }>("/messages/sent", {
    auth: true,
  });
}

export function fetchMessage(messageId: string) {
  return apiRequest<{ success: boolean; data: MessageItem }>(`/messages/${messageId}`, {
    auth: true,
  });
}

export function sendMessage(body: {
  recipientIds?: string[];
  batchId?: string;
  broadcastAllStudents?: boolean;
  broadcastAllTeachers?: boolean;
  subject: string;
  content: string;
  type?: string;
}) {
  return apiRequest<{ success: boolean; data: MessageItem }>("/messages", {
    method: "POST",
    body,
    auth: true,
  });
}

export function markMessageRead(messageId: string) {
  return apiRequest<{ success: boolean }>(`/messages/${messageId}/read`, {
    method: "PATCH",
    auth: true,
  });
}
