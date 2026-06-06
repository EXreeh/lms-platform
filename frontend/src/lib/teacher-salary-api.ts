import type { SalaryStatus, TeacherSalary, TeacherSalaryDashboard } from "@/types/institute";
import { apiRequest } from "./api";

function queryString(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function fetchTeacherSalaries(params?: {
  teacherId?: string;
  month?: number;
  year?: number;
  status?: SalaryStatus;
}) {
  return apiRequest<{ success: boolean; data: TeacherSalary[] }>(
    `/teacher-salaries${queryString(params ?? {})}`,
    { auth: true },
  );
}

export function fetchMyTeacherSalary() {
  return apiRequest<{ success: boolean; data: TeacherSalaryDashboard }>("/teacher-salaries/me", {
    auth: true,
  });
}

export function createTeacherSalary(body: {
  teacherId: string;
  month: number;
  year: number;
  baseSalary: number;
  bonus?: number;
  deductions?: number;
  note?: string;
}) {
  return apiRequest<{ success: boolean; data: TeacherSalary }>("/teacher-salaries", {
    method: "POST",
    auth: true,
    body,
  });
}

export function updateTeacherSalary(
  salaryId: string,
  body: Partial<{
    baseSalary: number;
    bonus: number;
    deductions: number;
    status: SalaryStatus;
    note: string | null;
  }>,
) {
  return apiRequest<{ success: boolean; data: TeacherSalary }>(`/teacher-salaries/${salaryId}`, {
    method: "PATCH",
    auth: true,
    body,
  });
}

export function markTeacherSalaryPaid(salaryId: string) {
  return apiRequest<{ success: boolean; data: TeacherSalary }>(
    `/teacher-salaries/${salaryId}/mark-paid`,
    { method: "POST", auth: true },
  );
}

export function markTeacherSalaryHold(salaryId: string) {
  return apiRequest<{ success: boolean; data: TeacherSalary }>(
    `/teacher-salaries/${salaryId}/mark-hold`,
    { method: "POST", auth: true },
  );
}
