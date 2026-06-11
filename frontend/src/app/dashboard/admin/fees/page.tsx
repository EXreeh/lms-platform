"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  SearchableUserSelect,
  type UserSelectOption,
} from "@/components/ui/searchable-user-select";
import {
  addFeePayment,
  createFeePlan,
  fetchFeeAnalytics,
  fetchFeePlan,
  fetchFeePlans,
  sendFeeReminder,
} from "@/lib/fees-api";
import { fetchAdminUsers, fetchAdminCourses } from "@/lib/admin-api";
import { fetchBatches } from "@/lib/batches-api";
import type { FeeAnalytics, FeePlan } from "@/types/institute";
import { useToast } from "@/context/toast-context";
import { ACTIVE_COURSE_LIST_PARAMS, filterActiveCourses } from "@/lib/course-filters";
import { formatApiError } from "@/lib/format-api-error";
import { StatCard } from "@/components/dashboard/stat-card";

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

export default function AdminFeesPage() {
  const { success, error: toastError } = useToast();
  const [plans, setPlans] = useState<FeePlan[]>([]);
  const [analytics, setAnalytics] = useState<FeeAnalytics | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FeePlan | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [studentOptions, setStudentOptions] = useState<UserSelectOption[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [courses, setCourses] = useState<{ value: string; label: string }[]>([]);
  const [batches, setBatches] = useState<{ value: string; label: string }[]>([]);
  const [createForm, setCreateForm] = useState({
    studentId: "",
    courseId: "",
    batchId: "",
    totalAmount: "",
    dueDate: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMode: "CASH",
    note: "",
  });
  const [reminderText, setReminderText] = useState("");
  const [confirmPayment, setConfirmPayment] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, analyticsRes] = await Promise.all([
        fetchFeePlans({ status: statusFilter || undefined, search: search || undefined }),
        fetchFeeAnalytics(),
      ]);
      setPlans(listRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      toastError(formatApiError(err, "Failed to load fees"));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void Promise.all([
      fetchAdminCourses(ACTIVE_COURSE_LIST_PARAMS),
      fetchBatches({ status: "ACTIVE" }),
    ]).then(([courseRes, batchRes]) => {
      setCourses(
        filterActiveCourses(courseRes.data.courses).map((c) => ({ value: c.id, label: c.title })),
      );
      setBatches(batchRes.data.map((b) => ({ value: b.id, label: b.name })));
    });
  }, []);

  useEffect(() => {
    if (!showCreate) return;
    const timer = setTimeout(() => {
      setUsersLoading(true);
      void loadStudents(studentSearch)
        .then(setStudentOptions)
        .finally(() => setUsersLoading(false));
    }, studentSearch ? 300 : 0);
    return () => clearTimeout(timer);
  }, [showCreate, studentSearch]);

  async function openPlan(id: string) {
    try {
      const res = await fetchFeePlan(id);
      setSelected(res.data);
    } catch (err) {
      toastError(formatApiError(err, "Failed to load fee plan"));
    }
  }

  async function handleCreate() {
    if (!createForm.studentId) {
      toastError("Please select a student.");
      return;
    }
    try {
      await createFeePlan({
        studentId: createForm.studentId,
        courseId: createForm.courseId || null,
        batchId: createForm.batchId || null,
        totalAmount: Number(createForm.totalAmount),
        dueDate: new Date(createForm.dueDate).toISOString(),
      });
      success("Fee plan created");
      setShowCreate(false);
      setCreateForm({
        studentId: "",
        courseId: "",
        batchId: "",
        totalAmount: "",
        dueDate: "",
      });
      void load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to create fee plan"));
    }
  }

  async function handlePayment() {
    if (!selected) return;
    try {
      await addFeePayment(selected.id, {
        amount: Number(paymentForm.amount),
        paymentMode: paymentForm.paymentMode,
        note: paymentForm.note || undefined,
      });
      success("Payment recorded");
      setConfirmPayment(false);
      setPaymentForm({ amount: "", paymentMode: "CASH", note: "" });
      await openPlan(selected.id);
      void load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to record payment"));
    }
  }

  async function handleReminder() {
    if (!selected || !reminderText.trim()) return;
    try {
      await sendFeeReminder(selected.id, reminderText);
      success("Reminder sent");
      setReminderText("");
    } catch (err) {
      toastError(formatApiError(err, "Failed to send reminder"));
    }
  }

  return (
    <DashboardShell
      title="Fee Management"
      description="Create institute fee plans, record offline payments, and send reminders."
      badge="Administrator"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="ADMIN" />
        <div className="min-w-0 flex-1 space-y-6">
          {analytics && (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Collected"
                value={`₹${analytics.totalCollected.toLocaleString()}`}
                icon="💰"
                accent="green"
              />
              <StatCard
                label="Pending"
                value={`₹${analytics.totalPending.toLocaleString()}`}
                icon="⏳"
                accent="gold"
              />
              <StatCard label="Overdue plans" value={analytics.overdueStudents} icon="⚠" />
            </div>
          )}

          <div className="flex flex-wrap items-end gap-3">
            <Input
              label="Search student"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select
              label="Status"
              options={[
                { value: "", label: "All" },
                { value: "PENDING", label: "Pending" },
                { value: "PARTIAL", label: "Partial" },
                { value: "PAID", label: "Paid" },
                { value: "OVERDUE", label: "Overdue" },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
            <Button variant="gold" onClick={() => setShowCreate(true)}>
              Create fee plan
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner label="Loading fees" />
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Student", "Total", "Paid", "Pending", "Status", "Due"].map((h) => (
                      <th key={h} className="px-4 py-3 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plans.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No fee records yet
                      </td>
                    </tr>
                  ) : (
                    plans.map((p) => (
                      <tr
                        key={p.id}
                        className="cursor-pointer border-b border-border hover:bg-muted/30"
                        onClick={() => void openPlan(p.id)}
                      >
                        <td className="px-4 py-3">{p.student?.name ?? "—"}</td>
                        <td className="px-4 py-3">₹{p.totalAmount}</td>
                        <td className="px-4 py-3">₹{p.paidAmount}</td>
                        <td className="px-4 py-3">₹{p.pendingAmount}</td>
                        <td className="px-4 py-3">{p.status}</td>
                        <td className="px-4 py-3">
                          {p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {selected && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-serif text-lg font-bold">
                {selected.student?.name} — {selected.accessLabel}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pending ₹{selected.pendingAmount}
                {selected.dueDate
                  ? ` · Due ${new Date(selected.dueDate).toLocaleDateString()}`
                  : ""}
              </p>
              {selected.payments && selected.payments.length > 0 && (
                <ul className="mt-4 divide-y divide-border text-sm">
                  {selected.payments.map((pay) => (
                    <li key={pay.id} className="flex justify-between py-2">
                      <span>
                        ₹{pay.amount} · {pay.paymentMode}
                      </span>
                      <span className="text-muted-foreground">
                        {(pay.paidAt ?? pay.paymentDate)
                          ? new Date(pay.paidAt ?? pay.paymentDate!).toLocaleDateString()
                          : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="gold" onClick={() => setConfirmPayment(true)}>
                  Add payment
                </Button>
              </div>
              <div className="mt-4 space-y-2">
                <textarea
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  placeholder="Fee reminder message…"
                  value={reminderText}
                  onChange={(e) => setReminderText(e.target.value)}
                />
                <Button variant="secondary" onClick={() => void handleReminder()}>
                  Send reminder
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <h3 className="font-serif text-lg font-bold">New fee plan</h3>
            <div className="mt-4 space-y-3">
              <SearchableUserSelect
                label="Student"
                options={studentOptions}
                value={createForm.studentId ? [createForm.studentId] : []}
                onChange={(ids) =>
                  setCreateForm((f) => ({ ...f, studentId: ids[0] ?? "" }))
                }
                placeholder="Search by name or email…"
                onSearchChange={setStudentSearch}
                loading={usersLoading}
              />
              <Select
                label="Course (optional)"
                options={[{ value: "", label: "None" }, ...courses]}
                value={createForm.courseId}
                onChange={(e) => setCreateForm((f) => ({ ...f, courseId: e.target.value }))}
              />
              <Select
                label="Batch (optional)"
                options={[{ value: "", label: "None" }, ...batches]}
                value={createForm.batchId}
                onChange={(e) => setCreateForm((f) => ({ ...f, batchId: e.target.value }))}
              />
              <Input
                label="Total amount (₹)"
                type="number"
                value={createForm.totalAmount}
                onChange={(e) => setCreateForm((f) => ({ ...f, totalAmount: e.target.value }))}
              />
              <Input
                label="Due date"
                type="date"
                value={createForm.dueDate}
                onChange={(e) => setCreateForm((f) => ({ ...f, dueDate: e.target.value }))}
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

      {confirmPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <h3 className="font-serif text-lg font-bold">Record payment</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Confirm offline payment installment for this student.
            </p>
            <div className="mt-4 space-y-3">
              <Input
                label="Amount (₹)"
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
              />
              <Select
                label="Payment mode"
                options={[
                  { value: "CASH", label: "Cash" },
                  { value: "UPI", label: "UPI" },
                  { value: "BANK_TRANSFER", label: "Bank transfer" },
                  { value: "CARD", label: "Card" },
                  { value: "OTHER", label: "Other" },
                ]}
                value={paymentForm.paymentMode}
                onChange={(e) => setPaymentForm((f) => ({ ...f, paymentMode: e.target.value }))}
              />
              <Input
                label="Note (optional)"
                value={paymentForm.note}
                onChange={(e) => setPaymentForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmPayment(false)}>
                Cancel
              </Button>
              <Button variant="gold" onClick={() => void handlePayment()}>
                Record payment
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
