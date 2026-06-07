"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { DashboardStatsSkeleton } from "@/components/learning/learning-skeleton";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { SalaryStatusBadge } from "@/components/institute/salary-status-badge";
import { EmptyState } from "@/components/courses/empty-state";
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
import { computeNetSalary, formatInr, MONTH_OPTIONS } from "@/lib/salary-utils";
import type { SalaryStatus, TeacherSalary, TeacherSalarySummary } from "@/types/institute";
import { useToast } from "@/context/toast-context";
import { formatApiError } from "@/lib/format-api-error";

const EMPTY_SUMMARY: TeacherSalarySummary = {
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  totalThisMonth: 0,
  paidSalary: 0,
  pendingSalary: 0,
  holdSalary: 0,
  recordCount: 0,
};

export default function AdminTeacherSalariesPage() {
  const { success, error: toastError } = useToast();
  const [salaries, setSalaries] = useState<TeacherSalary[]>([]);
  const [summary, setSummary] = useState<TeacherSalarySummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<{ value: string; label: string }[]>([]);
  const [filters, setFilters] = useState({
    teacherId: "",
    month: "",
    year: "",
    status: "",
    search: "",
  });
  const [showCreate, setShowCreate] = useState(false);
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
  const [confirmAction, setConfirmAction] = useState<{
    type: "paid" | "hold";
    row: TeacherSalary;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const createNet = useMemo(
    () =>
      computeNetSalary(
        Number(form.baseSalary) || 0,
        Number(form.bonus) || 0,
        Number(form.deductions) || 0,
      ),
    [form.baseSalary, form.bonus, form.deductions],
  );

  const editNet = useMemo(
    () =>
      computeNetSalary(
        Number(editForm.baseSalary) || 0,
        Number(editForm.bonus) || 0,
        Number(editForm.deductions) || 0,
      ),
    [editForm.baseSalary, editForm.bonus, editForm.deductions],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTeacherSalaries({
        teacherId: filters.teacherId || undefined,
        month: filters.month ? Number(filters.month) : undefined,
        year: filters.year ? Number(filters.year) : undefined,
        status: (filters.status || undefined) as SalaryStatus | undefined,
        search: filters.search || undefined,
      });
      setSalaries(res.data);
      setSummary(res.summary);
    } catch (err) {
      toastError(formatApiError(err, "Failed to load salaries"));
    } finally {
      setLoading(false);
    }
  }, [filters, toastError]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), filters.search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, filters.search]);

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
      setShowCreate(false);
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

  async function runConfirmAction() {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.type === "paid") {
        await markTeacherSalaryPaid(confirmAction.row.id);
        success("Salary marked as paid");
      } else {
        await markTeacherSalaryHold(confirmAction.row.id);
        success("Salary placed on hold");
      }
      setConfirmAction(null);
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to update salary"));
    } finally {
      setActionLoading(false);
    }
  }

  const summaryLabel = `${MONTH_OPTIONS[summary.month - 1]?.label} ${summary.year}`;

  return (
    <DashboardShell
      title="Teacher Salaries"
      description="Create and manage teacher salary records. Teachers can view their own salary only."
      badge="Administrator"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="ADMIN" />
        <div className="min-w-0 flex-1 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Summary for <span className="font-medium text-foreground">{summaryLabel}</span>
            </p>
            <Button variant="gold" onClick={() => setShowCreate(true)}>
              + Add salary
            </Button>
          </div>

          {loading && salaries.length === 0 ? (
            <DashboardStatsSkeleton />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total this month"
                value={formatInr(summary.totalThisMonth)}
                icon="💰"
                accent="gold"
              />
              <StatCard
                label="Paid"
                value={formatInr(summary.paidSalary)}
                icon="✓"
                accent="green"
              />
              <StatCard label="Pending" value={formatInr(summary.pendingSalary)} icon="⏳" />
              <StatCard label="On hold" value={formatInr(summary.holdSalary)} icon="⏸" />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Input
              label="Search teacher"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Name or email…"
            />
            <Select
              label="Teacher"
              value={filters.teacherId}
              onChange={(e) => setFilters((f) => ({ ...f, teacherId: e.target.value }))}
              options={[{ value: "", label: "All teachers" }, ...teachers]}
            />
            <Select
              label="Month"
              value={filters.month}
              onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))}
              options={[{ value: "", label: "All months" }, ...MONTH_OPTIONS]}
            />
            <Input
              label="Year"
              type="number"
              value={filters.year}
              onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}
              placeholder="e.g. 2026"
            />
            <Select
              label="Status"
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
          ) : salaries.length === 0 ? (
            <EmptyState
              title="No salary records yet"
              description="Create a salary record for a teacher to get started."
              icon="💰"
              action={
                <Button variant="gold" onClick={() => setShowCreate(true)}>
                  Add salary
                </Button>
              }
            />
          ) : (
            <div className="-mx-1 overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="border-b border-border bg-muted/30 text-muted-foreground">
                  <tr>
                    <th className="p-4 font-medium">Teacher</th>
                    <th className="p-4 font-medium">Period</th>
                    <th className="p-4 font-medium">Base</th>
                    <th className="p-4 font-medium">Bonus</th>
                    <th className="p-4 font-medium">Deductions</th>
                    <th className="p-4 font-medium">Net</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {salaries.map((row) => (
                    <tr key={row.id} className="border-b border-border/60 last:border-0">
                      <td className="p-4">
                        <div className="font-medium">{row.teacherName}</div>
                        <div className="text-xs text-muted-foreground">{row.teacherEmail}</div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {MONTH_OPTIONS[row.month - 1]?.label} {row.year}
                      </td>
                      <td className="p-4">{formatInr(row.baseSalary)}</td>
                      <td className="p-4">{formatInr(row.bonus)}</td>
                      <td className="p-4">{formatInr(row.deductions)}</td>
                      <td className="p-4 font-semibold">{formatInr(row.netSalary)}</td>
                      <td className="p-4">
                        <SalaryStatusBadge status={row.status} />
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
                            Edit
                          </Button>
                          {row.status !== "PAID" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setConfirmAction({ type: "paid", row })}
                            >
                              Mark paid
                            </Button>
                          )}
                          {row.status !== "HOLD" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmAction({ type: "hold", row })}
                            >
                              Hold
                            </Button>
                          )}
                        </div>
                        {row.note && (
                          <p className="mt-1 max-w-xs text-xs text-muted-foreground">{row.note}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6">
            <h3 className="font-serif text-lg font-bold">Create salary record</h3>
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
                options={MONTH_OPTIONS}
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
                min={0}
                value={form.baseSalary}
                onChange={(e) => setForm((f) => ({ ...f, baseSalary: e.target.value }))}
              />
              <Input
                label="Bonus (₹)"
                type="number"
                min={0}
                value={form.bonus}
                onChange={(e) => setForm((f) => ({ ...f, bonus: e.target.value }))}
              />
              <Input
                label="Deductions (₹)"
                type="number"
                min={0}
                value={form.deductions}
                onChange={(e) => setForm((f) => ({ ...f, deductions: e.target.value }))}
              />
              <div className="sm:col-span-2 rounded-xl border border-gold-500/30 bg-gold-500/5 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Net salary (auto)
                </p>
                <p className="mt-1 font-serif text-2xl font-bold">{formatInr(createNet)}</p>
              </div>
              <Input
                label="Note (optional)"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                className="sm:col-span-2"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                variant="gold"
                onClick={() => void handleCreate()}
                disabled={!form.teacherId || !form.baseSalary}
              >
                Create salary
              </Button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6">
            <h3 className="font-serif font-bold">
              Edit salary — {editing.teacherName} ({MONTH_OPTIONS[editing.month - 1]?.label}{" "}
              {editing.year})
            </h3>
            <div className="mt-4 space-y-3">
              <Input
                label="Base salary (₹)"
                type="number"
                min={0}
                value={editForm.baseSalary}
                onChange={(e) => setEditForm((f) => ({ ...f, baseSalary: e.target.value }))}
              />
              <Input
                label="Bonus (₹)"
                type="number"
                min={0}
                value={editForm.bonus}
                onChange={(e) => setEditForm((f) => ({ ...f, bonus: e.target.value }))}
              />
              <Input
                label="Deductions (₹)"
                type="number"
                min={0}
                value={editForm.deductions}
                onChange={(e) => setEditForm((f) => ({ ...f, deductions: e.target.value }))}
              />
              <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                <p className="text-xs text-muted-foreground">Net salary (auto)</p>
                <p className="mt-1 text-lg font-bold">{formatInr(editNet)}</p>
              </div>
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

      <ConfirmModal
        open={Boolean(confirmAction)}
        title={confirmAction?.type === "paid" ? "Mark salary as paid?" : "Place salary on hold?"}
        description={
          confirmAction
            ? `${confirmAction.row.teacherName} — ${MONTH_OPTIONS[confirmAction.row.month - 1]?.label} ${confirmAction.row.year} · ${formatInr(confirmAction.row.netSalary)}`
            : ""
        }
        confirmLabel={confirmAction?.type === "paid" ? "Mark paid" : "Place on hold"}
        variant={confirmAction?.type === "hold" ? "warning" : "default"}
        loading={actionLoading}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void runConfirmAction()}
      />
    </DashboardShell>
  );
}
