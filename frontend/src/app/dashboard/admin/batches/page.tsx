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
  addBatchStudents,
  createBatch,
  fetchBatch,
  fetchBatches,
  removeBatchStudent,
  updateBatch,
} from "@/lib/batches-api";
import { fetchAdminUsers } from "@/lib/admin-api";
import type { Batch } from "@/types/institute";
import { useToast } from "@/context/toast-context";
import { formatApiError } from "@/lib/format-api-error";

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
  const [teachers, setTeachers] = useState<{ value: string; label: string }[]>([]);
  const [students, setStudents] = useState<{ value: string; label: string }[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    teacherId: "",
    startDate: "",
    timing: "",
    daysOfWeek: "",
  });
  const [addStudentId, setAddStudentId] = useState("");

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
    void (async () => {
      const [t, s] = await Promise.all([
        fetchAdminUsers({ role: "TEACHER", limit: 100 }),
        fetchAdminUsers({ role: "STUDENT", limit: 200 }),
      ]);
      setTeachers(
        t.data.users.map((u) => ({
          value: u.id,
          label: `${u.firstName} ${u.lastName}`,
        })),
      );
      setStudents(
        s.data.users.map((u) => ({
          value: u.id,
          label: `${u.firstName} ${u.lastName}`,
        })),
      );
    })();
  }, []);

  async function handleCreate() {
    try {
      const res = await createBatch({
        name: form.name,
        description: form.description || undefined,
        teacherId: form.teacherId || null,
        startDate: new Date(form.startDate).toISOString(),
        timing: form.timing || undefined,
        daysOfWeek: form.daysOfWeek || undefined,
      });
      success("Batch created");
      setShowCreate(false);
      setSelected(res.data);
      void load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to create batch"));
    }
  }

  return (
    <DashboardShell
      title="Batch Management"
      description="Organize institute students into batches with teachers and schedules."
      badge="Administrator"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="ADMIN" />
        <div className="min-w-0 flex-1 space-y-6">
          <div className="flex flex-wrap gap-3">
            <Input
              label="Search"
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
              <ul className="mt-4 divide-y divide-border text-sm">
                {selected.students.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-2">
                    <span>
                      {s.name}
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
              <div className="mt-4 flex flex-wrap gap-2">
                <Select
                  label="Add student"
                  options={[{ value: "", label: "Select…" }, ...students]}
                  value={addStudentId}
                  onChange={(e) => setAddStudentId(e.target.value)}
                />
                <Button
                  variant="secondary"
                  className="self-end"
                  onClick={() => {
                    if (!addStudentId) return;
                    void addBatchStudents(selected.id, [addStudentId]).then((res) => {
                      setSelected(res.data);
                      success("Student added");
                      setAddStudentId("");
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
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6">
            <h3 className="font-serif text-lg font-bold">New batch</h3>
            <div className="mt-4 space-y-3">
              <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <Input
                label="Description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              <Select
                label="Teacher"
                options={[{ value: "", label: "None" }, ...teachers]}
                value={form.teacherId}
                onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}
              />
              <Input
                label="Start date"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
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
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button variant="gold" onClick={() => void handleCreate()}>
                Create
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
