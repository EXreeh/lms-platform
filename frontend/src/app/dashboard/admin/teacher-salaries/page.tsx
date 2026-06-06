"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { fetchAdminUsers } from "@/lib/admin-api";
import {
  createTeacherSalary,
  fetchTeacherSalaries,
  markTeacherSalaryHold,
  markTeacherSalaryPaid,
  updateTeacherSalary,
} from "@/lib/teacher-salary-api";
import type { SalaryStatus, TeacherSalary } from "@/types/institute";
import { useToast } from "@/context/toast-context";
import { formatApiError } from "@/lib/format-api-error";

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: new Date(2000, i, 1).toLocaleString("en", { month: "long" }),
}));

function statusBadge(status: SalaryStatus) {
  const styles =
    status === "PAID"
      ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
      : status === "HOLD"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
        : "bg-muted text-muted-foreground";
  const label = status === "PAID" ? "Paid" : status === "HOLD" ? "Hold" : "Pending";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}>{label}</span>
  );
}

export default function AdminTeacherSalariesPage() {
  const { success, error: toastError } = useToast();
  const [salaries, setSalaries] = useState<TeacherSalary[]>([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<{ value: string; label: string }[]>([]);
  const [filters, setFilters] = useState({
    teacherId: "",
    month: "",
    year: "",
    status: "",
  });
  const [form, setForm] = useState({
    teacherId: "",
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    baseSalary: "",
    bonus: "0",
    deductions: "0",
    note: "",
  });
  const [editing, setEditing] = useState<TeacherSalary | null>(null);
  const [editForm, setEditForm] = useState({
    baseSalary: "",
    bonus: "",
    deductions: "",
    note: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTeacherSalaries({
        teacherId: filters.teacherId || undefined,
        month: filters.month ? Number(filters.month) : undefined,
        year: filters.year ? Number(filters.year) : undefined,
        status: (filters.status || undefined) as SalaryStatus | undefined,
      });
      setSalaries(res.data);
    } catch (err) {
      toastError(formatApiError(err, "Failed to load salaries"));
    } finally {
      setLoading(false);
    }
  }, [filters, toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void fetchAdminUsers({ role: "TEACHER", limit: 100 }).then((res) => {
      setTeachers(
        res.data.users.map((u) => ({
          value: u.id,
          label: `${u.firstName} ${u.lastName}`,
        })),
      );
    });
  }, []);

  async function handleCreate() {
    try {
      await createTeacherSalary({
        teacherId: form.teacherId,
        month: Number(form.month),
        year: Number(form.year),
        baseSalary: Number(form.baseSalary),
        bonus: Number(form.bonus) || 0,
        deductions: Number(form.deductions) || 0,
        note: form.note || undefined,
      });
      success("Salary record created");
      setForm((f) => ({
        ...f,
        baseSalary: "",
        bonus: "0",
        deductions: "0",
        note: "",
      }));
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to create salary"));
    }
  }

  function openEdit(row: TeacherSalary) {
    setEditing(row);
    setEditForm({
      baseSalary: String(row.baseSalary),
      bonus: String(row.bonus),
      deductions: String(row.deductions),
      note: row.note ?? "",
    });
  }

  async function handleSaveEdit() {
    if (!editing) return;
    try {
      await updateTeacherSalary(editing.id, {
        baseSalary: Number(editForm.baseSalary),
        bonus: Number(editForm.bonus) || 0,
        deductions: Number(editForm.deductions) || 0,
        note: editForm.note || null,
      });
      success("Salary updated");
      setEditing(null);
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to update salary"));
    }
  }

  async function handleMarkPaid(id: string) {
    try {
      await markTeacherSalaryPaid(id);
      success("Marked as paid");
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to update salary"));
    }
  }

  async function handleMarkHold(id: string) {
    try {
      await markTeacherSalaryHold(id);
      success("Marked on hold");
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to update salary"));
    }
  }

  return (
    <DashboardShell
      title="Teacher Salaries"
      description="Create and manage teacher salary records. Teachers can view their own salary only."
      badge="Admin"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="ADMIN" />
        <div className="min-w-0 flex-1 space-y-8">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-serif font-bold">Create salary record</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Select
                label="Teacher"
                value={form.teacherId}
                onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))}
                options={[{ value: "", label: "Select teacher" }, ...teachers]}
              />
              <Select
                label="Month"
                value={form.month}
                onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))}
                options={MONTHS}
              />
              <Input
                label="Year"
                type="number"
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
              />
              <Input
                label="Base salary (₹)"
                type="number"
                value={form.baseSalary}
                onChange={(e) => setForm((f) => ({ ...f, baseSalary: e.target.value }))}
              />
              <Input
                label="Bonus (₹)"
                type="number"
                value={form.bonus}
                onChange={(e) => setForm((f) => ({ ...f, bonus: e.target.value }))}
              />
              <Input
                label="Deductions (₹)"
                type="number"
                value={form.deductions}
                onChange={(e) => setForm((f) => ({ ...f, deductions: e.target.value }))}
              />
              <Input
                label="Note (optional)"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                className="sm:col-span-2"
              />
            </div>
            <Button
              className="mt-4"
              variant="gold"
              onClick={() => void handleCreate()}
              disabled={!form.teacherId || !form.baseSalary}
            >
              Create salary
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Filter teacher"
              value={filters.teacherId}
              onChange={(e) => setFilters((f) => ({ ...f, teacherId: e.target.value }))}
              options={[{ value: "", label: "All teachers" }, ...teachers]}
            />
            <Select
              label="Filter month"
              value={filters.month}
              onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))}
              options={[{ value: "", label: "All months" }, ...MONTHS]}
            />
            <Input
              label="Filter year"
              type="number"
              value={filters.year}
              onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}
              placeholder="e.g. 2026"
            />
            <Select
              label="Filter status"
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              options={[
                { value: "", label: "All statuses" },
                { value: "PENDING", label: "Pending" },
                { value: "PAID", label: "Paid" },
                { value: "HOLD", label: "Hold" },
              ]}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner label="Loading salaries" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-border text-muted-foreground">
                  <tr>
                    <th className="p-4">Teacher</th>
                    <th className="p-4">Period</th>
                    <th className="p-4">Base</th>
                    <th className="p-4">Bonus</th>
                    <th className="p-4">Deductions</th>
                    <th className="p-4">Net (₹)</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {salaries.map((row) => (
                    <tr key={row.id} className="border-b border-border/60">
                      <td className="p-4">
                        <div className="font-medium">{row.teacherName}</div>
                        <div className="text-xs text-muted-foreground">{row.teacherEmail}</div>
                      </td>
                      <td className="p-4">
                        {MONTHS[row.month - 1]?.label} {row.year}
                      </td>
                      <td className="p-4">₹{row.baseSalary}</td>
                      <td className="p-4">₹{row.bonus}</td>
                      <td className="p-4">₹{row.deductions}</td>
                      <td className="p-4 font-medium">₹{row.netSalary}</td>
                      <td className="p-4">{statusBadge(row.status)}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
                            Edit
                          </Button>
                          {row.status !== "PAID" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => void handleMarkPaid(row.id)}
                            >
                              Mark paid
                            </Button>
                          )}
                          {row.status !== "HOLD" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => void handleMarkHold(row.id)}
                            >
                              Hold
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {salaries.length === 0 && (
                <p className="p-6 text-center text-muted-foreground">No salary records yet.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6">
            <h3 className="font-serif font-bold">
              Edit salary — {editing.teacherName} ({MONTHS[editing.month - 1]?.label}{" "}
              {editing.year})
            </h3>
            <div className="mt-4 space-y-3">
              <Input
                label="Base salary (₹)"
                type="number"
                value={editForm.baseSalary}
                onChange={(e) => setEditForm((f) => ({ ...f, baseSalary: e.target.value }))}
              />
              <Input
                label="Bonus (₹)"
                type="number"
                value={editForm.bonus}
                onChange={(e) => setEditForm((f) => ({ ...f, bonus: e.target.value }))}
              />
              <Input
                label="Deductions (₹)"
                type="number"
                value={editForm.deductions}
                onChange={(e) => setEditForm((f) => ({ ...f, deductions: e.target.value }))}
              />
              <Input
                label="Note"
                value={editForm.note}
                onChange={(e) => setEditForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button variant="gold" onClick={() => void handleSaveEdit()}>
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
