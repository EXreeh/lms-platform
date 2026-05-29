"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { ManagementTable } from "@/components/admin/management-table";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  fetchAdminCourses,
  fetchCourseAnalytics,
  adminPublishCourse,
  adminArchiveCourse,
  adminDeleteCourse,
} from "@/lib/admin-api";
import { COURSE_STATUS_LABELS, type CourseStatus } from "@/types/course";
import type { AdminCourse, CourseAnalytics } from "@/types/admin";
import { ApiClientError } from "@/lib/api";
import { useToast } from "@/context/toast-context";

type ConfirmAction =
  | { type: "delete"; course: AdminCourse }
  | { type: "archive"; course: AdminCourse }
  | { type: "publish"; course: AdminCourse };

export default function AdminCoursesPage() {
  const { success, error: toastError } = useToast();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CourseStatus | "">("");
  const [sortBy, setSortBy] = useState<"createdAt" | "title" | "updatedAt">("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAdminCourses({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      });
      setCourses(res.data.courses);
      setPagination(res.data.pagination);
    } catch (err) {
      toastError(err instanceof ApiClientError ? err.message : "Failed to load courses");
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, sortBy, sortOrder, toastError]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  async function openAnalytics(courseId: string) {
    setAnalyticsLoading(true);
    try {
      const res = await fetchCourseAnalytics(courseId);
      setAnalytics(res.data);
    } catch (err) {
      toastError(err instanceof ApiClientError ? err.message : "Failed to load analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function handleConfirm() {
    if (!confirm) return;
    setConfirmLoading(true);
    try {
      if (confirm.type === "delete") {
        await adminDeleteCourse(confirm.course.id);
        success("Course deleted");
        setAnalytics(null);
      } else if (confirm.type === "archive") {
        await adminArchiveCourse(confirm.course.id);
        success("Course archived");
      } else if (confirm.type === "publish") {
        await adminPublishCourse(confirm.course.id);
        success("Course approved");
      }
      setConfirm(null);
      await loadCourses();
    } catch (err) {
      toastError(err instanceof ApiClientError ? err.message : "Action failed");
    } finally {
      setConfirmLoading(false);
    }
  }

  function handleSort(key: string) {
    const k = key as typeof sortBy;
    if (sortBy === k) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortBy(k);
      setSortOrder("asc");
    }
    setPagination((p) => ({ ...p, page: 1 }));
  }

  const confirmProps = confirm
    ? confirm.type === "delete"
      ? {
          title: "Delete course",
          description: `Permanently delete "${confirm.course.title}" and all content?`,
          confirmLabel: "Delete course",
          variant: "danger" as const,
        }
      : confirm.type === "archive"
        ? {
            title: "Archive course",
            description: `"${confirm.course.title}" will be archived and removed from the catalog.`,
            confirmLabel: "Archive",
            variant: "warning" as const,
          }
        : {
            title: "Approve course",
            description: `Approve and publish "${confirm.course.title}" to the marketplace.`,
            confirmLabel: "Approve",
            variant: "warning" as const,
          }
    : null;

  return (
    <DashboardShell
      title="Course Moderation"
      description="Review, publish, archive, and analyze platform courses."
      badge="Administrator"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="ADMIN" />
        <div className="min-w-0 flex-1 space-y-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <Input
                label="Search"
                placeholder="Search courses…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
              />
            </div>
            <Select
              label="Status"
              value={statusFilter}
              options={[
                { value: "", label: "All statuses" },
                { value: "DRAFT", label: "Draft" },
                { value: "UNDER_REVIEW", label: "Under review" },
                { value: "APPROVED", label: "Approved" },
                { value: "REJECTED", label: "Rejected" },
                { value: "ARCHIVED", label: "Archived" },
              ]}
              onChange={(e) => {
                setStatusFilter(e.target.value as CourseStatus | "");
                setPagination((p) => ({ ...p, page: 1 }));
              }}
            />
          </div>

          <ManagementTable
            columns={[
              {
                key: "title",
                header: "Course",
                sortable: true,
                render: (c) => (
                  <div>
                    <p className="font-medium text-foreground">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.category} · {c.level}</p>
                  </div>
                ),
              },
              {
                key: "teacher",
                header: "Teacher",
                render: (c) => (
                  <span className="text-muted-foreground">{c.teacher?.name ?? "—"}</span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (c) => (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {COURSE_STATUS_LABELS[c.status] ?? c.status}
                  </span>
                ),
              },
              {
                key: "enrollmentCount",
                header: "Enrollments",
                render: (c) => c.enrollmentCount,
              },
              {
                key: "actions",
                header: "Actions",
                render: (c) => (
                  <div className="flex flex-wrap gap-1">
                    <Link href={`/courses/${c.slug}`}>
                      <Button size="sm" variant="ghost">
                        Preview
                      </Button>
                    </Link>
                    <Button size="sm" variant="secondary" onClick={() => void openAnalytics(c.id)}>
                      Analytics
                    </Button>
                    {c.status === "UNDER_REVIEW" && (
                      <Button
                        size="sm"
                        variant="gold"
                        onClick={() => setConfirm({ type: "publish", course: c })}
                      >
                        Approve
                      </Button>
                    )}
                    {c.status !== "ARCHIVED" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setConfirm({ type: "archive", course: c })}
                      >
                        Archive
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setConfirm({ type: "delete", course: c })}
                    >
                      Delete
                    </Button>
                  </div>
                ),
              },
            ]}
            data={courses}
            keyExtractor={(c) => c.id}
            pagination={pagination}
            onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            isLoading={isLoading}
          />

          {(analytics || analyticsLoading) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              {analyticsLoading ? (
                <p className="text-center text-muted-foreground">Loading analytics…</p>
              ) : analytics ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-serif text-xl font-bold">{analytics.course.title}</h2>
                      {analytics.teacher && (
                        <p className="text-sm text-muted-foreground">
                          Owner: {analytics.teacher.name} ({analytics.teacher.email})
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setAnalytics(null)}>
                      Close
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-4">
                    <div className="rounded-xl bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">Enrollments</p>
                      <p className="text-xl font-semibold">{analytics.analytics.totalEnrollments}</p>
                    </div>
                    <div className="rounded-xl bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="text-xl font-semibold">{analytics.analytics.completedEnrollments}</p>
                    </div>
                    <div className="rounded-xl bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">Avg progress</p>
                      <p className="text-xl font-semibold">{analytics.analytics.averageProgress}%</p>
                    </div>
                    <div className="rounded-xl bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">Quiz attempts</p>
                      <p className="text-xl font-semibold">{analytics.analytics.quizAttempts}</p>
                    </div>
                  </div>
                  {analytics.recentEnrollments.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium">Recent enrollments</h3>
                      <ul className="mt-2 divide-y divide-border text-sm">
                        {analytics.recentEnrollments.map((e) => (
                          <li key={e.id} className="flex justify-between py-2">
                            <span>{e.student.name}</span>
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
          onCancel={() => setConfirm(null)}
        />
      )}
    </DashboardShell>
  );
}
