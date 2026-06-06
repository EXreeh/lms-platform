"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { ManagementTable } from "@/components/admin/management-table";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  fetchAdminUsers,
  fetchAdminUser,
  changeUserRole,
  suspendUser,
  deleteAdminUser,
  resetUserPassword,
  createStudentAccount,
  createTeacherAccount,
  fetchAdminCourses,
} from "@/lib/admin-api";
import { fetchBatches } from "@/lib/batches-api";
import type { AdminUser, AdminUserDetail } from "@/types/admin";
import type { Role } from "@/types/auth";
import { ApiClientError } from "@/lib/api";
import { useToast } from "@/context/toast-context";

type ConfirmAction =
  | { type: "delete"; user: AdminUser }
  | { type: "suspend"; user: AdminUser; suspend: boolean }
  | { type: "role"; user: AdminUser; role: "STUDENT" | "TEACHER" }
  | { type: "reset"; user: AdminUser };

export default function AdminUsersPage() {
  const { success, error: toastError } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [suspendedFilter, setSuspendedFilter] = useState<"" | "true" | "false">("");
  const [sortBy, setSortBy] = useState<"createdAt" | "lastName" | "email" | "role">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [createMode, setCreateMode] = useState<"student" | "teacher" | null>(null);
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    batchId: "",
    courseId: "",
    feeTotal: "",
    feeDueDate: "",
    salaryMonth: String(new Date().getMonth() + 1),
    salaryYear: String(new Date().getFullYear()),
    baseSalary: "",
    salaryBonus: "0",
    salaryDeductions: "0",
  });
  const [batches, setBatches] = useState<{ value: string; label: string }[]>([]);
  const [courses, setCourses] = useState<{ value: string; label: string }[]>([]);
  const [resetPassword, setResetPassword] = useState("");

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAdminUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        role: roleFilter || undefined,
        suspended: suspendedFilter === "" ? undefined : suspendedFilter === "true",
        sortBy,
        sortOrder,
      });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (err) {
      toastError(err instanceof ApiClientError ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, roleFilter, suspendedFilter, sortBy, sortOrder, toastError]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    void (async () => {
      try {
        const [batchRes, courseRes] = await Promise.all([
          fetchBatches(),
          fetchAdminCourses({ limit: 100 }),
        ]);
        setBatches(
          batchRes.data.map((b) => ({ value: b.id, label: b.name })),
        );
        setCourses(
          courseRes.data.courses.map((c) => ({ value: c.id, label: c.title })),
        );
      } catch {
        /* optional dropdowns */
      }
    })();
  }, []);

  async function openDetail(userId: string) {
    setDetailLoading(true);
    try {
      const res = await fetchAdminUser(userId);
      setSelectedUser(res.data);
    } catch (err) {
      toastError(err instanceof ApiClientError ? err.message : "Failed to load user");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleConfirm() {
    if (!confirm) return;
    setConfirmLoading(true);
    try {
      if (confirm.type === "delete") {
        await deleteAdminUser(confirm.user.id);
        success("User deleted");
        setSelectedUser(null);
      } else if (confirm.type === "suspend") {
        await suspendUser(confirm.user.id, confirm.suspend);
        success(confirm.suspend ? "User suspended" : "User reactivated");
      } else if (confirm.type === "role") {
        await changeUserRole(confirm.user.id, confirm.role);
        success(`Role updated to ${confirm.role.toLowerCase()}`);
      } else if (confirm.type === "reset") {
        if (resetPassword.length < 8) {
          toastError("Password must be at least 8 characters");
          return;
        }
        await resetUserPassword(confirm.user.id, resetPassword);
        success("Password reset successfully");
        setResetPassword("");
      }
      setConfirm(null);
      await loadUsers();
      if (selectedUser && confirm.type !== "delete") {
        await openDetail(selectedUser.id);
      }
    } catch (err) {
      toastError(err instanceof ApiClientError ? err.message : "Action failed");
    } finally {
      setConfirmLoading(false);
    }
  }

  function resetCreateForm() {
    setCreateForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      batchId: "",
      courseId: "",
      feeTotal: "",
      feeDueDate: "",
      salaryMonth: String(new Date().getMonth() + 1),
      salaryYear: String(new Date().getFullYear()),
      baseSalary: "",
      salaryBonus: "0",
      salaryDeductions: "0",
    });
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!createMode) return;
    try {
      const base = {
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        email: createForm.email.trim().toLowerCase(),
        password: createForm.password,
        batchId: createForm.batchId || null,
      };

      if (createMode === "student") {
        const res = await createStudentAccount({
          ...base,
          courseId: createForm.courseId || null,
          feePlan:
            createForm.feeTotal && createForm.feeDueDate
              ? {
                  totalAmount: Number(createForm.feeTotal),
                  dueDate: new Date(createForm.feeDueDate).toISOString(),
                }
              : null,
        });
        const delivered = res.data.credentialsDelivered;
        success(
          delivered.emailSent
            ? "Student created — credentials sent via message and email"
            : "Student created — credentials sent via internal message",
        );
      } else {
        const res = await createTeacherAccount({
          ...base,
          salary:
            createForm.baseSalary
              ? {
                  month: Number(createForm.salaryMonth),
                  year: Number(createForm.salaryYear),
                  baseSalary: Number(createForm.baseSalary),
                  bonus: Number(createForm.salaryBonus) || 0,
                  deductions: Number(createForm.salaryDeductions) || 0,
                }
              : null,
        });
        const delivered = res.data.credentialsDelivered;
        success(
          delivered.emailSent
            ? "Teacher created — credentials sent via message and email"
            : "Teacher created — credentials sent via internal message",
        );
      }

      setCreateMode(null);
      resetCreateForm();
      await loadUsers();
    } catch (err) {
      toastError(err instanceof ApiClientError ? err.message : "Failed to create account");
    }
  }

  function handleSort(key: string) {
    const k = key as typeof sortBy;
    if (sortBy === k) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(k);
      setSortOrder("asc");
    }
    setPagination((p) => ({ ...p, page: 1 }));
  }

  const confirmProps = confirm
    ? confirm.type === "delete"
      ? {
          title: "Delete user",
          description: `Permanently delete ${confirm.user.name}? This cannot be undone.`,
          confirmLabel: "Delete user",
          variant: "danger" as const,
        }
      : confirm.type === "suspend"
        ? {
            title: confirm.suspend ? "Suspend user" : "Reactivate user",
            description: confirm.suspend
              ? `${confirm.user.name} will lose access immediately.`
              : `${confirm.user.name} will regain platform access.`,
            confirmLabel: confirm.suspend ? "Suspend" : "Reactivate",
            variant: "warning" as const,
          }
        : confirm.type === "role"
          ? {
              title: "Change role",
              description: `Change ${confirm.user.name} to ${confirm.role.toLowerCase()}?`,
              confirmLabel: "Update role",
              variant: "warning" as const,
            }
          : {
              title: "Reset password",
              description: `Set a new password for ${confirm.user.name}.`,
              confirmLabel: "Reset password",
              variant: "warning" as const,
            }
    : null;

  return (
    <DashboardShell
      title="User Management"
      description="Create institute student and teacher accounts. Only administrators can add users."
      badge="Administrator"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="ADMIN" />
        <div className="min-w-0 flex-1 space-y-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <Input
                label="Search"
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
              />
            </div>
            <Select
              label="Role"
              value={roleFilter}
              options={[
                { value: "", label: "All roles" },
                { value: "STUDENT", label: "Student" },
                { value: "TEACHER", label: "Teacher" },
                { value: "ADMIN", label: "Admin" },
              ]}
              onChange={(e) => {
                setRoleFilter(e.target.value as Role | "");
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            />
            <Select
              label="Status"
              value={suspendedFilter}
              options={[
                { value: "", label: "All statuses" },
                { value: "false", label: "Active" },
                { value: "true", label: "Suspended" },
              ]}
              onChange={(e) => {
                setSuspendedFilter(e.target.value as "" | "true" | "false");
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            />
            <Button variant="gold" onClick={() => setCreateMode("student")}>
              Create student
            </Button>
            <Button variant="secondary" onClick={() => setCreateMode("teacher")}>
              Create teacher
            </Button>
          </div>

          <ManagementTable
            columns={[
              {
                key: "name",
                header: "User",
                sortable: true,
                render: (u) => (
                  <div>
                    <p className="font-medium text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                ),
              },
              {
                key: "role",
                header: "Role",
                sortable: true,
                render: (u) => (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{u.role}</span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (u) => (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.suspended
                        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                        : "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                    }`}
                  >
                    {u.suspended ? "Suspended" : "Active"}
                  </span>
                ),
              },
              {
                key: "lastLoginAt",
                header: "Last login",
                render: (u) => (
                  <span className="text-muted-foreground">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "—"}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                render: (u) => (
                  <Button size="sm" variant="secondary" onClick={() => void openDetail(u.id)}>
                    Manage
                  </Button>
                ),
              },
            ]}
            data={users}
            keyExtractor={(u) => u.id}
            pagination={pagination}
            onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            isLoading={isLoading}
          />

          {(selectedUser || detailLoading) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              {detailLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner label="Loading user details" />
                </div>
              ) : selectedUser ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="font-serif text-xl font-bold">{selectedUser.name}</h2>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{selectedUser.role}</span>
                        {selectedUser.suspended && (
                          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
                            Suspended
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                      Close
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-3 text-sm">
                    <div className="rounded-xl bg-muted/40 p-3">
                      <p className="text-muted-foreground">Courses</p>
                      <p className="text-lg font-semibold">{selectedUser.courseCount}</p>
                    </div>
                    <div className="rounded-xl bg-muted/40 p-3">
                      <p className="text-muted-foreground">Enrollments</p>
                      <p className="text-lg font-semibold">{selectedUser.enrollmentCount}</p>
                    </div>
                    <div className="rounded-xl bg-muted/40 p-3">
                      <p className="text-muted-foreground">Quiz attempts</p>
                      <p className="text-lg font-semibold">{selectedUser.quizAttemptCount}</p>
                    </div>
                  </div>

                  {selectedUser.role !== "ADMIN" && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {selectedUser.role === "STUDENT" && (
                        <Button
                          size="sm"
                          variant="gold"
                          onClick={() =>
                            setConfirm({ type: "role", user: selectedUser, role: "TEACHER" })
                          }
                        >
                          Promote to teacher
                        </Button>
                      )}
                      {selectedUser.role === "TEACHER" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setConfirm({ type: "role", user: selectedUser, role: "STUDENT" })
                          }
                        >
                          Demote to student
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setConfirm({
                            type: "suspend",
                            user: selectedUser,
                            suspend: !selectedUser.suspended,
                          })
                        }
                      >
                        {selectedUser.suspended ? "Reactivate" : "Suspend"}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setConfirm({ type: "reset", user: selectedUser })}
                      >
                        Reset password
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setConfirm({ type: "delete", user: selectedUser })}
                      >
                        Delete
                      </Button>
                    </div>
                  )}

                  {confirm?.type === "reset" && confirm.user.id === selectedUser.id && (
                    <div className="mt-4 flex gap-2">
                      <Input
                        label="New password"
                        type="password"
                        placeholder="New password (min 8 chars)"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                      />
                    </div>
                  )}

                  {selectedUser.recentEnrollments.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium">Recent enrollments</h3>
                      <ul className="mt-2 divide-y divide-border text-sm">
                        {selectedUser.recentEnrollments.map((e) => (
                          <li key={e.id} className="flex justify-between py-2">
                            <Link href={`/courses/${e.course.slug}`} className="text-green-700 dark:text-gold-400">
                              {e.course.title}
                            </Link>
                            <span className="text-muted-foreground">{Math.round(e.progress)}%</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : null}
            </motion.div>
          )}
        </div>
      </div>

      {confirmProps && (
        <ConfirmModal
          open={Boolean(confirm)}
          {...confirmProps}
          loading={confirmLoading}
          onConfirm={() => void handleConfirm()}
          onCancel={() => {
            setConfirm(null);
            setResetPassword("");
          }}
        />
      )}

      {createMode && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setCreateMode(null)}
          />
          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={(e) => void handleCreateAccount(e)}
            className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 space-y-4 overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            <h2 className="font-serif text-lg font-bold">
              Create {createMode === "student" ? "student" : "teacher"} account
            </h2>
            <p className="text-xs text-muted-foreground">
              Login credentials will be sent as an internal message
              {createMode === "student" ? " (and by email when configured)." : " (and by email when configured)."}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First name"
                value={createForm.firstName}
                onChange={(e) => setCreateForm((f) => ({ ...f, firstName: e.target.value }))}
                required
              />
              <Input
                label="Last name"
                value={createForm.lastName}
                onChange={(e) => setCreateForm((f) => ({ ...f, lastName: e.target.value }))}
                required
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <Input
              label="Temporary password"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
              required
              minLength={8}
            />
            <Select
              label="Assigned batch (optional)"
              options={[{ value: "", label: "None" }, ...batches]}
              value={createForm.batchId}
              onChange={(e) => setCreateForm((f) => ({ ...f, batchId: e.target.value }))}
            />
            {createMode === "student" ? (
              <>
                <Select
                  label="Assigned course (optional)"
                  options={[{ value: "", label: "None" }, ...courses]}
                  value={createForm.courseId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, courseId: e.target.value }))}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Fee total ₹ (optional)"
                    type="number"
                    value={createForm.feeTotal}
                    onChange={(e) => setCreateForm((f) => ({ ...f, feeTotal: e.target.value }))}
                  />
                  <Input
                    label="Fee due date (optional)"
                    type="date"
                    value={createForm.feeDueDate}
                    onChange={(e) => setCreateForm((f) => ({ ...f, feeDueDate: e.target.value }))}
                  />
                </div>
              </>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Salary month (optional)"
                  options={Array.from({ length: 12 }, (_, i) => ({
                    value: String(i + 1),
                    label: new Date(2000, i, 1).toLocaleString("en", { month: "long" }),
                  }))}
                  value={createForm.salaryMonth}
                  onChange={(e) => setCreateForm((f) => ({ ...f, salaryMonth: e.target.value }))}
                />
                <Input
                  label="Salary year"
                  type="number"
                  value={createForm.salaryYear}
                  onChange={(e) => setCreateForm((f) => ({ ...f, salaryYear: e.target.value }))}
                />
                <Input
                  label="Base salary ₹ (optional)"
                  type="number"
                  value={createForm.baseSalary}
                  onChange={(e) => setCreateForm((f) => ({ ...f, baseSalary: e.target.value }))}
                />
                <Input
                  label="Bonus ₹"
                  type="number"
                  value={createForm.salaryBonus}
                  onChange={(e) => setCreateForm((f) => ({ ...f, salaryBonus: e.target.value }))}
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setCreateMode(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="gold">
                Create account
              </Button>
            </div>
          </motion.form>
        </>
      )}
    </DashboardShell>
  );
}
