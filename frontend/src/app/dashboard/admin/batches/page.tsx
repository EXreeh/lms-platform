"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { BatchStatusBadge } from "@/components/institute/batch-status-badge";
import { EmptyState } from "@/components/courses/empty-state";
import { DashboardStatsSkeleton } from "@/components/learning/learning-skeleton";
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
  deleteBatch,
  fetchBatch,
  fetchBatches,
  removeBatchStudent,
  updateBatch,
} from "@/lib/batches-api";
import { fetchAdminUsers, fetchAdminCourses } from "@/lib/admin-api";
import type { Batch, BatchStatus } from "@/types/institute";
import type { AppRole } from "@/types/auth";
import { useToast } from "@/context/toast-context";
import { ACTIVE_COURSE_LIST_PARAMS, filterActiveCourses } from "@/lib/course-filters";
import { formatApiError } from "@/lib/format-api-error";

async function loadUsers(role: AppRole, search?: string): Promise<UserSelectOption[]> {
  const res = await fetchAdminUsers({ role, search: search || undefined, limit: 100 });
  return res.data.users.map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`.trim(),
    email: u.email,
    role: u.role,
  }));
}

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "DELETED", label: "Deleted" },
];

type BatchFormState = {
  name: string;
  description: string;
  courseId: string;
  teacherId: string[];
  studentIds: string[];
  startDate: string;
  endDate: string;
  timing: string;
  daysOfWeek: string;
  status: string;
};

const emptyForm = (): BatchFormState => ({
  name: "",
  description: "",
  courseId: "",
  teacherId: [],
  studentIds: [],
  startDate: "",
  endDate: "",
  timing: "",
  daysOfWeek: "",
  status: "ACTIVE",
});

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminBatchesPage() {
  const { success, error: toastError } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [selected, setSelected] = useState<Batch | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ batchId: string; studentId: string } | null>(
    null,
  );
  const [statusConfirm, setStatusConfirm] = useState<{
    batchId: string;
    status: BatchStatus;
    name: string;
  } | null>(null);
  const [deleteBatchConfirm, setDeleteBatchConfirm] = useState<{
    batchId: string;
    name: string;
  } | null>(null);
  const [teacherOptions, setTeacherOptions] = useState<UserSelectOption[]>([]);
  const [studentOptions, setStudentOptions] = useState<UserSelectOption[]>([]);
  const [addStudentOptions, setAddStudentOptions] = useState<UserSelectOption[]>([]);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [addStudentSearch, setAddStudentSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [courses, setCourses] = useState<{ value: string; label: string }[]>([]);
  const [form, setForm] = useState<BatchFormState>(emptyForm());
  const [editForm, setEditForm] = useState<BatchFormState>(emptyForm());
  const [addStudentIds, setAddStudentIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchBatches({
        search: search || undefined,
        status: statusFilter || undefined,
        includeDeleted: showDeleted || statusFilter === "DELETED",
      });
      setBatches(res.data);
    } catch (err) {
      toastError(formatApiError(err, "Failed to load batches"));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, showDeleted, toastError]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  useEffect(() => {
    void fetchAdminCourses(ACTIVE_COURSE_LIST_PARAMS).then((res) => {
      setCourses(
        filterActiveCourses(res.data.courses).map((course) => ({
          value: course.id,
          label: course.title,
        })),
      );
    });
  }, []);

  useEffect(() => {
    if (!showCreate && !showEdit) return;
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
  }, [showCreate, showEdit, teacherSearch, studentSearch]);

  useEffect(() => {
    if (!selected) return;
    const timer = setTimeout(() => {
      void loadUsers("STUDENT", addStudentSearch).then(setAddStudentOptions);
    }, addStudentSearch ? 300 : 0);
    return () => clearTimeout(timer);
  }, [selected, addStudentSearch]);

  async function openBatchDetail(batchId: string) {
    setDetailLoading(true);
    try {
      const res = await fetchBatch(batchId);
      setSelected(res.data);
    } catch (err) {
      toastError(formatApiError(err, "Failed to load batch details"));
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleCreate() {
    try {
      const res = await createBatch({
        name: form.name,
        description: form.description || undefined,
        courseId: form.courseId || null,
        teacherId: form.teacherId[0] || null,
        studentIds: form.studentIds,
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
        timing: form.timing || undefined,
        daysOfWeek: form.daysOfWeek || undefined,
        status: form.status,
      });
      success("Batch created — students receive batch and course access");
      setShowCreate(false);
      setForm(emptyForm());
      setSelected(res.data);
      void load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to create batch"));
    }
  }

  async function handleSaveEdit() {
    if (!selected) return;
    try {
      await updateBatch(selected.id, {
        name: editForm.name,
        description: editForm.description || undefined,
        courseId: editForm.courseId || null,
        teacherId: editForm.teacherId[0] || null,
        startDate: editForm.startDate ? new Date(editForm.startDate).toISOString() : undefined,
        endDate: editForm.endDate ? new Date(editForm.endDate).toISOString() : null,
        timing: editForm.timing || undefined,
        daysOfWeek: editForm.daysOfWeek || undefined,
        status: editForm.status,
      });
      const detail = await fetchBatch(selected.id);
      success("Batch updated");
      setShowEdit(false);
      setSelected(detail.data);
      void load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to update batch"));
    }
  }

  function openEditModal(batch: Batch) {
    setEditForm({
      name: batch.name,
      description: batch.description ?? "",
      courseId: batch.courseId ?? "",
      teacherId: batch.teacherId ? [batch.teacherId] : [],
      studentIds: batch.students.map((s) => s.studentId),
      startDate: batch.startDate ? batch.startDate.slice(0, 10) : "",
      endDate: batch.endDate ? batch.endDate.slice(0, 10) : "",
      timing: batch.timing ?? "",
      daysOfWeek: batch.daysOfWeek ?? "",
      status: batch.status,
    });
    setShowEdit(true);
  }

  async function applyStatusChange() {
    if (!statusConfirm) return;
    try {
      await updateBatch(statusConfirm.batchId, { status: statusConfirm.status });
      const detail = await fetchBatch(statusConfirm.batchId);
      setSelected(detail.data);
      success(`Batch marked as ${statusConfirm.status.toLowerCase()}`);
      setStatusConfirm(null);
      void load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to update batch status"));
    }
  }

  async function handleDeleteBatch() {
    if (!deleteBatchConfirm) return;
    try {
      await deleteBatch(deleteBatchConfirm.batchId);
      success("Batch deleted");
      setDeleteBatchConfirm(null);
      setSelected(null);
      void load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to delete batch"));
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
          <div className="flex flex-wrap items-end gap-3">
            <Input
              label="Search batches"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or description…"
              className="min-w-[12rem] flex-1"
            />
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[{ value: "", label: "All statuses" }, ...STATUS_OPTIONS]}
              className="min-w-[10rem]"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
              />
              Show deleted
            </label>
            <Button variant="gold" className="shrink-0" onClick={() => setShowCreate(true)}>
              + Create batch
            </Button>
          </div>

          {loading && batches.length === 0 ? (
            <DashboardStatsSkeleton />
          ) : loading ? (
            <div className="flex justify-center py-16">
              <Spinner label="Loading batches" />
            </div>
          ) : batches.length === 0 ? (
            <EmptyState
              title="No batches created yet"
              description="Create your first batch to assign teachers, students, and courses."
              icon="📅"
              action={
                <Button variant="gold" onClick={() => setShowCreate(true)}>
                  Create batch
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {batches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`rounded-2xl border p-5 text-left transition-colors hover:border-gold-500/50 ${
                    selected?.id === b.id ? "border-gold-500 bg-muted/30" : "border-border bg-card"
                  }`}
                  onClick={() => void openBatchDetail(b.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif font-bold">{b.name}</h3>
                    <BatchStatusBadge status={b.status} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {b.teacher?.name ?? "No teacher"} · {b.studentCount} student
                    {b.studentCount === 1 ? "" : "s"}
                  </p>
                  {b.timing && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {b.timing}
                      {b.daysOfWeek ? ` · ${b.daysOfWeek}` : ""}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Starts {formatDate(b.startDate)}
                  </p>
                </button>
              ))}
            </div>
          )}

          {detailLoading && (
            <div className="flex justify-center py-8">
              <Spinner label="Loading batch details" />
            </div>
          )}

          {selected && !detailLoading && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-serif text-xl font-bold">{selected.name}</h2>
                  {selected.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{selected.description}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => openEditModal(selected)}>
                    Edit batch
                  </Button>
                  <Link href="/dashboard/admin/messages">
                    <Button variant="ghost" size="sm">
                      Messages
                    </Button>
                  </Link>
                </div>
              </div>

              <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Teacher</dt>
                  <dd className="font-medium">{selected.teacher?.name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Course</dt>
                  <dd className="font-medium">
                    {selected.course?.title ??
                      selected.assignedCourses?.[0]?.title ??
                      "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Timing</dt>
                  <dd className="font-medium">{selected.timing ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Days</dt>
                  <dd className="font-medium">{selected.daysOfWeek ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Start date</dt>
                  <dd className="font-medium">{formatDate(selected.startDate)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">End date</dt>
                  <dd className="font-medium">{formatDate(selected.endDate)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="mt-1">
                    <BatchStatusBadge status={selected.status} />
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                {selected.status === "ACTIVE" && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setStatusConfirm({
                          batchId: selected.id,
                          status: "COMPLETED",
                          name: selected.name,
                        })
                      }
                    >
                      Mark completed
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setStatusConfirm({
                          batchId: selected.id,
                          status: "CANCELLED",
                          name: selected.name,
                        })
                      }
                    >
                      Cancel batch
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        setDeleteBatchConfirm({ batchId: selected.id, name: selected.name })
                      }
                    >
                      Delete batch
                    </Button>
                  </>
                )}
              </div>

              {(selected.assignedCourses?.length ?? 0) > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium">Batch courses</h3>
                  <ul className="mt-2 text-sm text-muted-foreground">
                    {selected.assignedCourses!.map((c) => (
                      <li key={c.id}>{c.title}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6">
                <h3 className="text-sm font-medium">
                  Students ({selected.students.length})
                </h3>
                {selected.students.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">No students assigned yet.</p>
                ) : (
                  <ul className="mt-3 divide-y divide-border text-sm">
                    {selected.students.map((s) => (
                      <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                        <span>
                          {s.name}
                          <span className="ml-2 text-xs text-muted-foreground">{s.email}</span>
                          {s.accessStatus ? (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({s.accessStatus})
                            </span>
                          ) : null}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDeleteConfirm({ batchId: selected.id, studentId: s.studentId })
                          }
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-6 max-w-md">
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
                      void load();
                    });
                  }}
                >
                  Add {addStudentIds.length > 0 ? `${addStudentIds.length} ` : ""}to batch
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
              <Input
                label="Description (optional)"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
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
                showSelectAll
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
                label="End date (optional)"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
              <Input
                label="Timing"
                placeholder="e.g. 6:00 PM – 8:00 PM"
                value={form.timing}
                onChange={(e) => setForm((f) => ({ ...f, timing: e.target.value }))}
              />
              <Input
                label="Days of week"
                placeholder="Mon, Wed, Fri"
                value={form.daysOfWeek}
                onChange={(e) => setForm((f) => ({ ...f, daysOfWeek: e.target.value }))}
              />
              <Select
                label="Status"
                options={STATUS_OPTIONS}
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
                Create batch ({form.studentIds.length} student
                {form.studentIds.length === 1 ? "" : "s"})
              </Button>
            </div>
          </div>
        </div>
      )}

      {showEdit && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-card p-6">
            <h3 className="font-serif text-lg font-bold">Edit batch</h3>
            <div className="mt-4 space-y-4">
              <Input
                label="Batch name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Input
                label="Description"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
              <Select
                label="Course"
                options={[{ value: "", label: "No course" }, ...courses]}
                value={editForm.courseId}
                onChange={(e) => setEditForm((f) => ({ ...f, courseId: e.target.value }))}
              />
              <SearchableUserSelect
                label="Teacher"
                options={teacherOptions}
                value={editForm.teacherId}
                onChange={(ids) => setEditForm((f) => ({ ...f, teacherId: ids.slice(0, 1) }))}
                onSearchChange={setTeacherSearch}
                loading={usersLoading}
                placeholder="Search teachers…"
              />
              <Input
                label="Start date"
                type="date"
                value={editForm.startDate}
                onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))}
              />
              <Input
                label="End date (optional)"
                type="date"
                value={editForm.endDate}
                onChange={(e) => setEditForm((f) => ({ ...f, endDate: e.target.value }))}
              />
              <Input
                label="Timing"
                value={editForm.timing}
                onChange={(e) => setEditForm((f) => ({ ...f, timing: e.target.value }))}
              />
              <Input
                label="Days of week"
                value={editForm.daysOfWeek}
                onChange={(e) => setEditForm((f) => ({ ...f, daysOfWeek: e.target.value }))}
              />
              <Select
                label="Status"
                options={STATUS_OPTIONS}
                value={editForm.status}
                onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowEdit(false)}>
                Cancel
              </Button>
              <Button variant="gold" onClick={() => void handleSaveEdit()}>
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteConfirm)}
        title="Remove student"
        description="Remove this student from the batch? Their course access may be updated."
        variant="danger"
        confirmLabel="Remove"
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (!deleteConfirm) return;
          void removeBatchStudent(deleteConfirm.batchId, deleteConfirm.studentId).then((res) => {
            setSelected(res.data);
            setDeleteConfirm(null);
            success("Student removed");
            void load();
          });
        }}
      />

      <ConfirmModal
        open={Boolean(statusConfirm)}
        title={
          statusConfirm?.status === "COMPLETED" ? "Mark batch as completed?" : "Cancel this batch?"
        }
        description={
          statusConfirm
            ? `"${statusConfirm.name}" will be marked as ${statusConfirm.status.toLowerCase()}.`
            : ""
        }
        variant="warning"
        confirmLabel="Confirm"
        onCancel={() => setStatusConfirm(null)}
        onConfirm={() => void applyStatusChange()}
      />

      <ConfirmModal
        open={Boolean(deleteBatchConfirm)}
        title="Delete batch"
        description={
          deleteBatchConfirm
            ? `Delete "${deleteBatchConfirm.name}"? Students and teachers will no longer see this batch.`
            : ""
        }
        variant="danger"
        confirmLabel="Delete batch"
        onCancel={() => setDeleteBatchConfirm(null)}
        onConfirm={() => void handleDeleteBatch()}
      />
    </DashboardShell>
  );
}
