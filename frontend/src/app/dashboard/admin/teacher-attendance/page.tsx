"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { StatCard } from "@/components/dashboard/stat-card";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { fetchAdminUsers } from "@/lib/admin-api";
import {
  approveLeave,
  fetchAttendanceList,
  fetchAttendanceSummary,
  fetchLeaveRequests,
  markMissingAbsent,
  rejectLeave,
  type AttendanceRecord,
  type AttendanceSummary,
  type LeaveRequest,
} from "@/lib/teacher-attendance-api";
import { useToast } from "@/context/toast-context";
import { formatApiError } from "@/lib/format-api-error";

const STATUS_LABELS: Record<string, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LEAVE: "Leave",
  HALF_DAY: "Half day",
};

export default function AdminTeacherAttendancePage() {
  const { success, error: toastError } = useToast();
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [teachers, setTeachers] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().slice(0, 10),
    teacherId: "",
    status: "",
  });
  const [leaveFilter, setLeaveFilter] = useState("PENDING");
  const [confirmAbsent, setConfirmAbsent] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, listRes, leaveRes] = await Promise.all([
        fetchAttendanceSummary(filters.date),
        fetchAttendanceList({
          date: filters.date || undefined,
          teacherId: filters.teacherId || undefined,
          status: (filters.status || undefined) as AttendanceRecord["status"] | undefined,
        }),
        fetchLeaveRequests(
          (leaveFilter || undefined) as LeaveRequest["status"] | undefined,
        ),
      ]);
      setSummary(sumRes.data);
      setRows(listRes.data);
      setLeaves(leaveRes.data);
    } catch (err) {
      toastError(formatApiError(err, "Failed to load attendance data"));
    } finally {
      setLoading(false);
    }
  }, [filters.date, filters.teacherId, filters.status, leaveFilter, toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void fetchAdminUsers({ role: "TEACHER", suspended: false, limit: 100 }).then((res) => {
      setTeachers(
        res.data.users.map((t) => ({
          value: t.id,
          label: `${t.firstName} ${t.lastName}`.trim(),
        })),
      );
    });
  }, []);

  async function handleMarkAbsent() {
    setActionLoading(true);
    try {
      const res = await markMissingAbsent(filters.date);
      success(`Marked ${res.marked} teacher(s) as absent`);
      setConfirmAbsent(false);
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to mark absent"));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLeave(leaveId: string, approve: boolean) {
    try {
      if (approve) await approveLeave(leaveId);
      else await rejectLeave(leaveId);
      success(approve ? "Leave approved" : "Leave rejected");
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to review leave"));
    }
  }

  return (
    <DashboardShell
      title="Teacher Attendance"
      description="Monitor teacher attendance, review leave requests, and mark missing records."
      badge="Administrator"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="ADMIN" />
        <div className="min-w-0 flex-1 space-y-6">
          {summary && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Present today" value={summary.present} icon="✓" accent="green" />
              <StatCard label="Absent today" value={summary.absent} icon="✗" accent="gold" />
              <StatCard label="On leave" value={summary.onLeave} icon="📅" />
              <StatCard
                label="Pending leave requests"
                value={summary.pendingLeaveRequests}
                icon="⏳"
              />
            </div>
          )}

          <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-4">
            <Input
              label="Date"
              type="date"
              value={filters.date}
              onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
            />
            <Select
              label="Teacher"
              value={filters.teacherId}
              onChange={(e) => setFilters((f) => ({ ...f, teacherId: e.target.value }))}
              options={[{ value: "", label: "All teachers" }, ...teachers]}
            />
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              options={[
                { value: "", label: "All statuses" },
                { value: "PRESENT", label: "Present" },
                { value: "ABSENT", label: "Absent" },
                { value: "LEAVE", label: "Leave" },
                { value: "HALF_DAY", label: "Half day" },
              ]}
            />
            <Button variant="secondary" onClick={() => setConfirmAbsent(true)}>
              Mark missing as absent
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner label="Loading attendance" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-border bg-muted/30 text-muted-foreground">
                    <tr>
                      <th className="p-4">Teacher</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Marked at</th>
                      <th className="p-4">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          No attendance records for selected filters.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr key={row.id} className="border-b border-border/60">
                          <td className="p-4">
                            <div className="font-medium">{row.teacherName}</div>
                            <div className="text-xs text-muted-foreground">{row.teacherEmail}</div>
                          </td>
                          <td className="p-4">{row.date}</td>
                          <td className="p-4">{STATUS_LABELS[row.status]}</td>
                          <td className="p-4">
                            {new Date(row.markedAt).toLocaleString()}
                          </td>
                          <td className="p-4 text-muted-foreground">{row.note ?? "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <h2 className="font-serif font-bold">Leave requests</h2>
                  <Select
                    label="Status filter"
                    value={leaveFilter}
                    onChange={(e) => setLeaveFilter(e.target.value)}
                    options={[
                      { value: "PENDING", label: "Pending" },
                      { value: "APPROVED", label: "Approved" },
                      { value: "REJECTED", label: "Rejected" },
                      { value: "", label: "All" },
                    ]}
                  />
                </div>
                {leaves.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">No leave requests found.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-border">
                    {leaves.map((leave) => (
                      <li key={leave.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                        <div>
                          <p className="font-medium">{leave.teacherName}</p>
                          <p className="text-sm text-muted-foreground">
                            {leave.fromDate} → {leave.toDate}
                          </p>
                          <p className="mt-1 text-sm">{leave.reason}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                            {leave.status}
                          </span>
                          {leave.status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                variant="gold"
                                onClick={() => void handleLeave(leave.id, true)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => void handleLeave(leave.id, false)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmAbsent}
        title="Mark missing attendance as absent"
        description={`Mark all teachers without attendance on ${filters.date} as absent?`}
        confirmLabel="Mark absent"
        variant="warning"
        loading={actionLoading}
        onCancel={() => setConfirmAbsent(false)}
        onConfirm={() => void handleMarkAbsent()}
      />
    </DashboardShell>
  );
}
