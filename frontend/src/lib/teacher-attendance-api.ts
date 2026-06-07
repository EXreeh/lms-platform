import { apiRequest } from "./api";

function queryString(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LEAVE" | "HALF_DAY";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface AttendanceRecord {
  id: string;
  teacherId: string;
  teacherName?: string;
  teacherEmail?: string;
  date: string;
  status: AttendanceStatus;
  markedAt: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  teacherId: string;
  teacherName?: string;
  teacherEmail?: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: LeaveStatus;
  reviewedById: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSummary {
  date: string;
  totalTeachers: number;
  present: number;
  absent: number;
  onLeave: number;
  pendingLeaveRequests: number;
}

export function markMyAttendance(body: { status: "PRESENT" | "LEAVE"; note?: string }) {
  return apiRequest<{ success: boolean; data: AttendanceRecord }>("/teacher-attendance/me", {
    method: "POST",
    body,
    auth: true,
  });
}

export function fetchMyAttendanceHistory() {
  return apiRequest<{ success: boolean; data: AttendanceRecord[] }>("/teacher-attendance/me", {
    auth: true,
  });
}

export function submitLeaveRequest(body: { fromDate: string; toDate: string; reason: string }) {
  return apiRequest<{ success: boolean; data: LeaveRequest }>("/teacher-attendance/leave", {
    method: "POST",
    body,
    auth: true,
  });
}

export function fetchMyLeaveRequests() {
  return apiRequest<{ success: boolean; data: LeaveRequest[] }>("/teacher-attendance/leave/me", {
    auth: true,
  });
}

export function fetchAttendanceSummary(date?: string) {
  return apiRequest<{ success: boolean; data: AttendanceSummary }>(
    `/teacher-attendance/summary${queryString({ date })}`,
    { auth: true },
  );
}

export function fetchAttendanceList(params?: {
  teacherId?: string;
  date?: string;
  from?: string;
  to?: string;
  status?: AttendanceStatus;
}) {
  return apiRequest<{ success: boolean; data: AttendanceRecord[] }>(
    `/teacher-attendance${queryString(params ?? {})}`,
    { auth: true },
  );
}

export function fetchLeaveRequests(status?: LeaveStatus) {
  return apiRequest<{ success: boolean; data: LeaveRequest[] }>(
    `/teacher-attendance/leave${queryString({ status })}`,
    { auth: true },
  );
}

export function updateAttendance(
  attendanceId: string,
  body: { status: AttendanceStatus; note?: string | null },
) {
  return apiRequest<{ success: boolean; data: AttendanceRecord }>(
    `/teacher-attendance/${attendanceId}`,
    { method: "PATCH", body, auth: true },
  );
}

export function approveLeave(leaveId: string) {
  return apiRequest<{ success: boolean; data: LeaveRequest }>(
    `/teacher-attendance/leave/${leaveId}/approve`,
    { method: "POST", auth: true },
  );
}

export function rejectLeave(leaveId: string) {
  return apiRequest<{ success: boolean; data: LeaveRequest }>(
    `/teacher-attendance/leave/${leaveId}/reject`,
    { method: "POST", auth: true },
  );
}

export function markMissingAbsent(date?: string) {
  return apiRequest<{ success: boolean; date: string; marked: number }>(
    "/teacher-attendance/mark-missing-absent",
    { method: "POST", body: date ? { date } : {}, auth: true },
  );
}
