"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  SearchableUserSelect,
  type UserSelectOption,
} from "@/components/ui/searchable-user-select";
import {
  addBatchStudents,
  createBatch,
  fetchBatch,
  fetchBatches,
  removeBatchStudent,
  updateBatch,
} from "@/lib/batches-api";
import { fetchAdminUsers, fetchAdminCourses } from "@/lib/admin-api";
import { assignCourseToBatch } from "@/lib/course-access-api";
import type { Batch } from "@/types/institute";
import type { Role } from "@/types/auth";
import { useToast } from "@/context/toast-context";
import { formatApiError } from "@/lib/format-api-error";

async function loadUsers(role: Role, search?: string): Promise<UserSelectOption[]> {
  const res = await fetchAdminUsers({ role, search: search || undefined, limit: 100 });
  return res.data.users.map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`.trim(),
    email: u.email,
    role: u.role,
  }));
}

export default function AdminBatchesPage() {
  const { success, error: toastError } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Batch | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ batchId: string; studentId: string } | null>(
    null,
  );
  const [teacherOptions, setTeacherOptions] = useState<UserSelectOption[]>([]);
  const [studentOptions, setStudentOptions] = useState<UserSelectOption[]>([]);
  const [addStudentOptions, setAddStudentOptions] = useState<UserSelectOption[]>([]);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [addStudentSearch, setAddStudentSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [courses, setCourses] = useState<{ value: string; label: string }[]>([]);
  const [assignCourseId, setAssignCourseId] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    courseId: "",
    teacherId: [] as string[],
    studentIds: [] as string[],
    startDate: "",
    timing: "",
    daysOfWeek: "",
    status: "ACTIVE",
  });
  const [addStudentIds, setAddStudentIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchBatches({ search: search || undefined });
      setBatches(res.data);
    } catch (err) {
      toastError(formatApiError(err, "Failed to load batches"));
    } finally {
      setLoading(false);
    }
  }, [search, toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void fetchAdminCourses({ limit: 100 }).then((res) => {
      setCourses(
        res.data.courses.map((course) => ({
          value: course.id,
          label: course.title,
        })),
      );
    });
  }, []);

  useEffect(() => {
    if (!showCreate) return;
    const timer = setTimeout(() => {
      setUsersLoading(true);
      void Promise.all([loadUsers("TEACHER", teacherSearch), loadUsers("STUDENT", studentSearch)])
        .then(([teachers, students]) => {
          setTeacherOptions(teachers);
          setStudentOptions(students);
        })
        .finally(() => setUsersLoading(false));
    }, teacherSearch || studentSearch ? 300 : 0);
    return () => clearTimeout(timer);
  }, [showCreate, teacherSearch, studentSearch]);

  useEffect(() => {
    if (!selected) return;
    const timer = setTimeout(() => {
      void loadUsers("STUDENT", addStudentSearch).then(setAddStudentOptions);
    }, addStudentSearch ? 300 : 0);
    return () => clearTimeout(timer);
  }, [selected, addStudentSearch]);

  async function handleCreate() {
    try {
      const res = await createBatch({
        name: form.name,
        description: form.description || undefined,
        courseId: form.courseId || null,
        teacherId: form.teacherId[0] || null,
        studentIds: form.studentIds,
        startDate: new Date(form.startDate).toISOString(),
        timing: form.timing || undefined,
        daysOfWeek: form.daysOfWeek || undefined,
        status: form.status,
      });
      success("Batch created — students receive batch and course access");
      setShowCreate(false);
      setSelected(res.data);
      setForm({
        name: "",
        description: "",
        courseId: "",
        teacherId: [],
        studentIds: [],
        startDate: "",
        timing: "",
        daysOfWeek: "",
        status: "ACTIVE",
      });
      void load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to create batch"));
    }
  }

  return (
    <DashboardShell
      title="Batch Management"
      description="Create batches with teachers, students, courses, and schedules."
      badge="Administrator"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="ADMIN" />
        <div className="min-w-0 flex-1 space-y-6">
          <div className="flex flex-wrap gap-3">
            <Input
              label="Search batches"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Button variant="gold" className="self-end" onClick={() => setShowCreate(true)}>
              Create batch
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner label="Loading batches" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {batches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`rounded-2xl border p-5 text-left transition-colors ${
                    selected?.id === b.id ? "border-gold-500 bg-muted/30" : "border-border bg-card"
                  }`}
                  onClick={() => {
                    void fetchBatch(b.id).then((res) => setSelected(res.data));
                  }}
                >
                  <h3 className="font-serif font-bold">{b.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {b.teacher?.name ?? "No teacher"} · {b.studentCount} students · {b.status}
                  </p>
                  {b.timing && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {b.timing}
                      {b.daysOfWeek ? ` · ${b.daysOfWeek}` : ""}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-serif text-lg font-bold">{selected.name}</h2>
                <Select
                  label="Status"
                  options={[
                    { value: "ACTIVE", label: "Active" },
                    { value: "COMPLETED", label: "Completed" },
                    { value: "CANCELLED", label: "Cancelled" },
                  ]}
                  value={selected.status}
                  onChange={(e) =>
                    void updateBatch(selected.id, { status: e.target.value }).then((res) => {
                      setSelected(res.data);
                      success("Batch updated");
                      void load();
                    })
                  }
                />
              </div>
              {(selected.assignedCourses?.length ?? 0) > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium">Batch courses</h3>
                  <ul className="mt-2 text-sm text-muted-foreground">
                    {selected.assignedCourses!.map((c) => (
                      <li key={c.id}>{c.title}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Select
                  label="Assign course"
                  options={[{ value: "", label: "Select course…" }, ...courses]}
                  value={assignCourseId}
                  onChange={(e) => setAssignCourseId(e.target.value)}
                />
                <Button
                  variant="secondary"
                  className="self-end"
                  disabled={!assignCourseId}
                  onClick={() => {
                    if (!assignCourseId) return;
                    void assignCourseToBatch(selected.id, assignCourseId).then(() => {
                      success("Course assigned to batch");
                      void fetchBatch(selected.id).then((res) => setSelected(res.data));
                      setAssignCourseId("");
                    });
                  }}
                >
                  Assign course
                </Button>
              </div>
              <ul className="mt-4 divide-y divide-border text-sm">
                {selected.students.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-2">
                    <span>
                      {s.name}
                      <span className="ml-2 text-xs text-muted-foreground">{s.email}</span>
                      {s.accessStatus ? (
                        <span className="ml-2 text-xs text-muted-foreground">({s.accessStatus})</span>
                      ) : null}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm({ batchId: selected.id, studentId: s.studentId })}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="mt-4 max-w-md">
                <SearchableUserSelect
                  label="Add students"
                  options={addStudentOptions}
                  value={addStudentIds}
                  onChange={setAddStudentIds}
                  multiple
                  onSearchChange={setAddStudentSearch}
                  placeholder="Search students by name or email…"
                />
                <Button
                  variant="secondary"
                  className="mt-2"
                  disabled={addStudentIds.length === 0}
                  onClick={() => {
                    void addBatchStudents(selected.id, addStudentIds).then((res) => {
                      setSelected(res.data);
                      success("Students added");
                      setAddStudentIds([]);
                    });
                  }}
                >
                  Add to batch
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-card p-6">
            <h3 className="font-serif text-lg font-bold">New batch</h3>
            <div className="mt-4 space-y-4">
              <Input
                label="Batch name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <Select
                label="Course"
                options={[{ value: "", label: "Select course (optional)" }, ...courses]}
                value={form.courseId}
                onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
              />
              <SearchableUserSelect
                label="Teacher"
                options={teacherOptions}
                value={form.teacherId}
                onChange={(ids) => setForm((f) => ({ ...f, teacherId: ids.slice(0, 1) }))}
                onSearchChange={setTeacherSearch}
                loading={usersLoading}
                placeholder="Search teachers by name or email…"
              />
              <SearchableUserSelect
                label="Students"
                options={studentOptions}
                value={form.studentIds}
                onChange={(ids) => setForm((f) => ({ ...f, studentIds: ids }))}
                multiple
                onSearchChange={setStudentSearch}
                loading={usersLoading}
                placeholder="Search students by name or email…"
              />
              <Input
                label="Start date"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                required
              />
              <Input
                label="Timing"
                placeholder="e.g. 6:00 PM – 8:00 PM"
                value={form.timing}
                onChange={(e) => setForm((f) => ({ ...f, timing: e.target.value }))}
              />
              <Input
                label="Days"
                placeholder="Mon, Wed, Fri"
                value={form.daysOfWeek}
                onChange={(e) => setForm((f) => ({ ...f, daysOfWeek: e.target.value }))}
              />
              <Select
                label="Status"
                options={[
                  { value: "ACTIVE", label: "Active" },
                  { value: "COMPLETED", label: "Completed" },
                  { value: "CANCELLED", label: "Cancelled" },
                ]}
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                variant="gold"
                disabled={!form.name || !form.startDate}
                onClick={() => void handleCreate()}
              >
                Create batch
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteConfirm)}
        title="Remove student"
        description="Remove this student from the batch?"
        variant="danger"
        confirmLabel="Remove"
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (!deleteConfirm) return;
          void removeBatchStudent(deleteConfirm.batchId, deleteConfirm.studentId).then((res) => {
            setSelected(res.data);
            setDeleteConfirm(null);
            success("Student removed");
          });
        }}
      />
    </DashboardShell>
  );
}
