"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchMyAttendanceHistory,
  fetchMyLeaveRequests,
  markMyAttendance,
  submitLeaveRequest,
  type AttendanceRecord,
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

export default function TeacherAttendancePage() {
  const { success, error: toastError } = useToast();
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    fromDate: "",
    toDate: "",
    reason: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, l] = await Promise.all([fetchMyAttendanceHistory(), fetchMyLeaveRequests()]);
      setHistory(h.data);
      setLeaves(l.data);
    } catch (err) {
      toastError(formatApiError(err, "Failed to load attendance"));
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleMark(status: "PRESENT" | "LEAVE") {
    setMarking(true);
    try {
      await markMyAttendance({ status });
      success(status === "PRESENT" ? "Marked present for today" : "Leave recorded for today");
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to mark attendance"));
    } finally {
      setMarking(false);
    }
  }

  async function handleLeaveSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!leaveForm.fromDate || !leaveForm.toDate || !leaveForm.reason.trim()) {
      toastError("Please fill all leave request fields");
      return;
    }
    try {
      await submitLeaveRequest(leaveForm);
      success("Leave request submitted");
      setLeaveForm({ fromDate: "", toDate: "", reason: "" });
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to submit leave request"));
    }
  }

  const todayRecord = history.find((r) => r.date === new Date().toISOString().slice(0, 10));

  return (
    <DashboardShell
      title="My Attendance"
      description="Mark daily attendance and submit leave requests."
      badge="Teacher Portal"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="TEACHER" />
        <div className="min-w-0 flex-1 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-serif font-bold">Today&apos;s attendance</h2>
            {todayRecord ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Already marked: <strong>{STATUS_LABELS[todayRecord.status]}</strong> at{" "}
                {new Date(todayRecord.markedAt).toLocaleTimeString()}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Mark your attendance once per day.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="gold"
                disabled={marking}
                onClick={() => void handleMark("PRESENT")}
              >
                Mark present
              </Button>
              <Button
                variant="secondary"
                disabled={marking}
                onClick={() => void handleMark("LEAVE")}
              >
                Mark leave (today)
              </Button>
            </div>
          </div>

          <form
            onSubmit={(e) => void handleLeaveSubmit(e)}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <h2 className="font-serif font-bold">Submit leave request</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                label="From date"
                type="date"
                value={leaveForm.fromDate}
                onChange={(e) => setLeaveForm((f) => ({ ...f, fromDate: e.target.value }))}
                required
              />
              <Input
                label="To date"
                type="date"
                value={leaveForm.toDate}
                onChange={(e) => setLeaveForm((f) => ({ ...f, toDate: e.target.value }))}
                required
              />
            </div>
            <textarea
              className="mt-4 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
              placeholder="Reason for leave…"
              rows={3}
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm((f) => ({ ...f, reason: e.target.value }))}
              required
            />
            <Button className="mt-4" type="submit" variant="gold">
              Submit leave request
            </Button>
          </form>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner label="Loading attendance" />
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-serif font-bold">Attendance history</h2>
                {history.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">No attendance records yet.</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-border text-muted-foreground">
                        <tr>
                          <th className="py-2 pr-4">Date</th>
                          <th className="py-2 pr-4">Status</th>
                          <th className="py-2">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((row) => (
                          <tr key={row.id} className="border-b border-border/60">
                            <td className="py-2 pr-4">{row.date}</td>
                            <td className="py-2 pr-4">{STATUS_LABELS[row.status]}</td>
                            <td className="py-2 text-muted-foreground">{row.note ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-serif font-bold">My leave requests</h2>
                {leaves.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">No leave requests yet.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-border text-sm">
                    {leaves.map((leave) => (
                      <li key={leave.id} className="py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span>
                            {leave.fromDate} → {leave.toDate}
                          </span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                            {leave.status}
                          </span>
                        </div>
                        <p className="mt-1 text-muted-foreground">{leave.reason}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
