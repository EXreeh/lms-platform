"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  SearchableUserSelect,
  type UserSelectOption,
} from "@/components/ui/searchable-user-select";
import { fetchAdminUsers, fetchAdminCourses } from "@/lib/admin-api";
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

async function loadStudents(search?: string): Promise<UserSelectOption[]> {
  const res = await fetchAdminUsers({
    role: "STUDENT",
    suspended: false,
    search: search || undefined,
    limit: 100,
  });
  return res.data.users.map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`.trim(),
    email: u.email,
    role: u.role,
  }));
}

export default function AdminCourseAccessPage() {
  const { success, error: toastError } = useToast();
  const [rows, setRows] = useState<CourseAccessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentOptions, setStudentOptions] = useState<UserSelectOption[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [courses, setCourses] = useState<{ value: string; label: string }[]>([]);
  const [filterStudentId, setFilterStudentId] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<{
    studentId: string;
    courseId: string;
    label: string;
  } | null>(null);
  const [form, setForm] = useState({
    studentId: "",
    courseId: "",
    accessType: "ADMIN_ASSIGNED" as AccessType,
    lifetimeAccess: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchCourseAccessList(
        filterStudentId ? { studentId: filterStudentId } : undefined,
      );
      setRows(res.data);
    } catch (err) {
      toastError(formatApiError(err, "Failed to load access records"));
    } finally {
      setLoading(false);
    }
  }, [filterStudentId, toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void fetchAdminCourses({ limit: 100 }).then((c) => {
      setCourses(
        c.data.courses.map((course) => ({
          value: course.id,
          label: course.title,
        })),
      );
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setUsersLoading(true);
      void loadStudents(studentSearch)
        .then(setStudentOptions)
        .finally(() => setUsersLoading(false));
    }, studentSearch ? 300 : 0);
    return () => clearTimeout(timer);
  }, [studentSearch]);

  const groupedByStudent = useMemo(() => {
    const map = new Map<string, CourseAccessRecord[]>();
    for (const row of rows) {
      const list = map.get(row.studentId) ?? [];
      list.push(row);
      map.set(row.studentId, list);
    }
    return map;
  }, [rows]);

  async function handleAssign() {
    if (!form.studentId) {
      toastError("Please select a student.");
      return;
    }
    if (!form.courseId) {
      toastError("Please select a course.");
      return;
    }
    try {
      await assignCourseToStudent(form);
      success("Course access assigned");
      setForm((f) => ({ ...f, courseId: "" }));
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to assign access"));
    }
  }

  async function handleRevoke(studentId: string, courseId: string) {
    try {
      await revokeCourseAccess(studentId, courseId);
      success("Access revoked");
      setRevokeTarget(null);
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
              <SearchableUserSelect
                label="Student"
                options={studentOptions}
                value={form.studentId ? [form.studentId] : []}
                onChange={(ids) =>
                  setForm((f) => ({ ...f, studentId: ids[0] ?? "" }))
                }
                placeholder="Search by name or email…"
                onSearchChange={setStudentSearch}
                loading={usersLoading}
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
                  { value: "ADMIN_ASSIGNED", label: "Admin assigned (normal)" },
                  { value: "BATCH_ASSIGNED", label: "Batch assigned" },
                  { value: "FULL_FEE_PAID", label: "Full fee paid" },
                  { value: "TRIAL", label: "Trial" },
                ]}
              />
              <label className="flex items-center gap-2 self-end text-sm">
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
            <Button className="mt-4" variant="gold" onClick={() => void handleAssign()}>
              Assign access
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-serif font-bold">Filter by student</h2>
            <div className="mt-4 max-w-md">
              <SearchableUserSelect
                label="Student"
                options={studentOptions}
                value={filterStudentId ? [filterStudentId] : []}
                onChange={(ids) => setFilterStudentId(ids[0] ?? "")}
                placeholder="Search to filter records…"
                onSearchChange={setStudentSearch}
                loading={usersLoading}
              />
              {filterStudentId && (
                <Button
                  className="mt-2"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilterStudentId("")}
                >
                  Clear filter
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner label="Loading access" />
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
              No access records yet. Assign a course to a student above.
            </div>
          ) : filterStudentId ? (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border text-muted-foreground">
                  <tr>
                    <th className="p-4">Course</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Lifetime</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-border/60">
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
                            onClick={() =>
                              setRevokeTarget({
                                studentId: row.studentId,
                                courseId: row.courseId,
                                label: row.courseTitle,
                              })
                            }
                          >
                            Revoke
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-6">
              {[...groupedByStudent.entries()].map(([studentId, studentRows]) => (
                <div
                  key={studentId}
                  className="overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <div className="border-b border-border bg-muted/30 px-4 py-3">
                    <p className="font-medium">{studentRows[0]?.studentName}</p>
                    <p className="text-xs text-muted-foreground">{studentRows[0]?.studentEmail}</p>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border text-muted-foreground">
                      <tr>
                        <th className="p-4">Course</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Lifetime</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentRows.map((row) => (
                        <tr key={row.id} className="border-b border-border/60">
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
                                onClick={() =>
                                  setRevokeTarget({
                                    studentId: row.studentId,
                                    courseId: row.courseId,
                                    label: row.courseTitle,
                                  })
                                }
                              >
                                Revoke
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {revokeTarget && (
        <ConfirmModal
          open
          title="Revoke course access"
          description={`Remove access to "${revokeTarget.label}" for this student?`}
          confirmLabel="Revoke access"
          variant="danger"
          onConfirm={() =>
            void handleRevoke(revokeTarget.studentId, revokeTarget.courseId)
          }
          onCancel={() => setRevokeTarget(null)}
        />
      )}
    </DashboardShell>
  );
}
