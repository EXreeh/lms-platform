import type {
  DashboardResponse,
  TeacherDashboardData,
  AdminDashboardData,
  StudentDashboardData,
} from "@/types/dashboard";
import { apiRequest } from "./api";

export function fetchTeacherDashboard() {
  return apiRequest<DashboardResponse<TeacherDashboardData>>("/dashboard/teacher", {
    auth: true,
  });
}

export function fetchAdminDashboard() {
  return apiRequest<DashboardResponse<AdminDashboardData>>("/dashboard/admin", {
    auth: true,
  });
}

export function fetchStudentDashboard() {
  return apiRequest<DashboardResponse<StudentDashboardData>>("/dashboard/student", {
    auth: true,
  });
}
