"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { fetchAdminUsers } from "@/lib/admin-api";
import { fetchAdminCourses } from "@/lib/admin-api";
import {
  assignCourseToStudent,
  fetchCourseAccessList,
  grantLifetimeAccess,
  revokeCourseAccess,
} from "@/lib/course-access-api";
import type { CourseAccessRecord } from "@/lib/course-access-api";
import type { AccessType } from "@/types/institute";
import { useToast } from "@/context/toast-context";
import { formatApiError } from "@/lib/format-api-error";

export default function AdminCourseAccessPage() {
  const { success, error: toastError } = useToast();
  const [rows, setRows] = useState<CourseAccessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<{ value: string; label: string }[]>([]);
  const [courses, setCourses] = useState<{ value: string; label: string }[]>([]);
  const [form, setForm] = useState({
    studentId: "",
    courseId: "",
    accessType: "ADMIN_ASSIGNED" as AccessType,
    lifetimeAccess: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchCourseAccessList();
      setRows(res.data);
    } catch (err) {
      toastError(formatApiError(err, "Failed to load access records"));
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      const [s, c] = await Promise.all([
        fetchAdminUsers({ role: "STUDENT", limit: 200 }),
        fetchAdminCourses({ limit: 100 }),
      ]);
      setStudents(
        s.data.users.map((u) => ({
          value: u.id,
          label: `${u.firstName} ${u.lastName}`,
        })),
      );
      setCourses(
        c.data.courses.map((course) => ({
          value: course.id,
          label: course.title,
        })),
      );
    })();
  }, []);

  async function handleAssign() {
    try {
      await assignCourseToStudent(form);
      success("Course access assigned");
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to assign access"));
    }
  }

  async function handleRevoke(studentId: string, courseId: string) {
    try {
      await revokeCourseAccess(studentId, courseId);
      success("Access revoked");
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to revoke access"));
    }
  }

  async function handleLifetime(studentId: string, courseId: string) {
    try {
      await grantLifetimeAccess(studentId, courseId);
      success("Lifetime access granted");
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to grant lifetime access"));
    }
  }

  return (
    <DashboardShell
      title="Course Access"
      description="Assign, revoke, and manage student course access for the institute portal."
      badge="Admin"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="ADMIN" />
        <div className="min-w-0 flex-1 space-y-8">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-serif font-bold">Assign course to student</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Select
                label="Student"
                value={form.studentId}
                onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
                options={[{ value: "", label: "Select student" }, ...students]}
              />
              <Select
                label="Course"
                value={form.courseId}
                onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
                options={[{ value: "", label: "Select course" }, ...courses]}
              />
              <Select
                label="Access type"
                value={form.accessType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, accessType: e.target.value as AccessType }))
                }
                options={[
                  { value: "ADMIN_ASSIGNED", label: "Admin assigned" },
                  { value: "BATCH_ASSIGNED", label: "Batch assigned" },
                  { value: "FULL_FEE_PAID", label: "Full fee paid" },
                  { value: "TRIAL", label: "Trial" },
                ]}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.lifetimeAccess}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lifetimeAccess: e.target.checked }))
                  }
                />
                Grant lifetime access
              </label>
            </div>
            <Button className="mt-4" onClick={handleAssign} disabled={!form.studentId || !form.courseId}>
              Assign access
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner label="Loading access" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border text-muted-foreground">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Course</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Lifetime</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-border/60">
                      <td className="p-4">
                        <div className="font-medium">{row.studentName}</div>
                        <div className="text-xs text-muted-foreground">{row.studentEmail}</div>
                      </td>
                      <td className="p-4">{row.courseTitle}</td>
                      <td className="p-4">{row.accessType}</td>
                      <td className="p-4">{row.lifetimeAccess ? "Yes" : "No"}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {!row.lifetimeAccess && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleLifetime(row.studentId, row.courseId)}
                            >
                              Grant lifetime
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRevoke(row.studentId, row.courseId)}
                          >
                            Revoke
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 && (
                <p className="p-6 text-center text-muted-foreground">No access records yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
