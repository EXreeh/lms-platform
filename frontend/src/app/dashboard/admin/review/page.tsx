"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CourseCard } from "@/components/courses/course-card";
import { RejectCourseModal } from "@/components/admin/reject-course-modal";
import {
  fetchReviewQueue,
  fetchPendingDeletes,
  approveCourse,
  rejectCourse,
  approveDeleteRequest,
  rejectDeleteRequest,
} from "@/lib/admin-api";
import type { Course } from "@/types/course";
import { ApiClientError } from "@/lib/api";
import { useToast } from "@/context/toast-context";

export default function AdminReviewPage() {
  const { success, error: toastError } = useToast();
  const [queue, setQueue] = useState<Course[]>([]);
  const [deletes, setDeletes] = useState<{
    courses: { id: string; title: string; slug: string }[];
    modules: { id: string; title: string; courseId: string }[];
    lessons: { id: string; title: string; moduleId: string }[];
    quizzes: { id: string; title: string; lessonId: string }[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Course | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [queueRes, deletesRes] = await Promise.all([
        fetchReviewQueue(),
        fetchPendingDeletes(),
      ]);
      setQueue(queueRes.data.courses);
      setDeletes(deletesRes.data);
    } catch (err) {
      toastError(err instanceof ApiClientError ? err.message : "Failed to load review queue");
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleApprove(courseId: string) {
    setActionId(courseId);
    try {
      await approveCourse(courseId);
      success("Course approved and published");
      await load();
    } catch (err) {
      toastError(err instanceof ApiClientError ? err.message : "Approve failed");
    } finally {
      setActionId(null);
    }
  }

  async function handleRejectConfirm() {
    if (!rejectTarget) return;
    setActionId(rejectTarget.id);
    try {
      await rejectCourse(rejectTarget.id, rejectReason.trim());
      success("Course rejected");
      setRejectTarget(null);
      setRejectReason("");
      await load();
    } catch (err) {
      toastError(err instanceof ApiClientError ? err.message : "Reject failed");
    } finally {
      setActionId(null);
    }
  }

  async function handleApproveDelete(
    entityType: "course" | "module" | "lesson" | "quiz",
    entityId: string,
  ) {
    if (!confirm("Approve permanent deletion?")) return;
    try {
      await approveDeleteRequest(entityType, entityId);
      success("Delete approved");
      await load();
    } catch (err) {
      toastError(err instanceof ApiClientError ? err.message : "Failed");
    }
  }

  async function handleRejectDelete(
    entityType: "course" | "module" | "lesson" | "quiz",
    entityId: string,
  ) {
    try {
      await rejectDeleteRequest(entityType, entityId);
      success("Delete request rejected");
      await load();
    } catch (err) {
      toastError(err instanceof ApiClientError ? err.message : "Failed");
    }
  }

  const pendingCount =
    queue.length +
    (deletes?.courses.length ?? 0) +
    (deletes?.modules.length ?? 0) +
    (deletes?.lessons.length ?? 0) +
    (deletes?.quizzes.length ?? 0);

  return (
    <DashboardShell
      title="Review Queue"
      description={`${pendingCount} item${pendingCount !== 1 ? "s" : ""} awaiting your decision.`}
      badge="Administrator"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="ADMIN" />
        <div className="min-w-0 flex-1 space-y-8">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" label="Loading review queue" />
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <section>
                <h2 className="font-serif text-lg font-bold">Pending course approvals</h2>
                {queue.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">No courses awaiting review.</p>
                ) : (
                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    {queue.map((course) => (
                      <div key={course.id} className="space-y-3">
                        <CourseCard
                          course={course}
                          href={`/dashboard/teacher/courses/${course.id}/edit`}
                          showStatus
                        />
                        <div className="flex flex-wrap gap-2 px-1">
                          <Button
                            size="sm"
                            variant="gold"
                            disabled={actionId === course.id}
                            onClick={() => void handleApprove(course.id)}
                          >
                            Approve & publish
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={actionId === course.id}
                            onClick={() => {
                              setRejectTarget(course);
                              setRejectReason("");
                            }}
                          >
                            Reject
                          </Button>
                          <Link href={`/courses/${course.slug}`}>
                            <Button size="sm" variant="ghost">Preview</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-serif text-lg font-bold">Pending delete requests</h2>
                {!deletes ||
                deletes.courses.length +
                  deletes.modules.length +
                  deletes.lessons.length +
                  deletes.quizzes.length ===
                  0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">No pending delete requests.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-border text-sm">
                    {deletes.courses.map((c) => (
                      <li key={c.id} className="flex items-center justify-between py-3">
                        <span>Course: {c.title}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="danger" onClick={() => void handleApproveDelete("course", c.id)}>
                            Approve
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => void handleRejectDelete("course", c.id)}>
                            Deny
                          </Button>
                        </div>
                      </li>
                    ))}
                    {deletes.modules.map((m) => (
                      <li key={m.id} className="flex items-center justify-between py-3">
                        <span>Module: {m.title}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="danger" onClick={() => void handleApproveDelete("module", m.id)}>
                            Approve
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => void handleRejectDelete("module", m.id)}>
                            Deny
                          </Button>
                        </div>
                      </li>
                    ))}
                    {deletes.lessons.map((l) => (
                      <li key={l.id} className="flex items-center justify-between py-3">
                        <span>Lesson: {l.title}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="danger" onClick={() => void handleApproveDelete("lesson", l.id)}>
                            Approve
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => void handleRejectDelete("lesson", l.id)}>
                            Deny
                          </Button>
                        </div>
                      </li>
                    ))}
                    {deletes.quizzes.map((q) => (
                      <li key={q.id} className="flex items-center justify-between py-3">
                        <span>Quiz: {q.title}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="danger" onClick={() => void handleApproveDelete("quiz", q.id)}>
                            Approve
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => void handleRejectDelete("quiz", q.id)}>
                            Deny
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </motion.div>
          )}
        </div>
      </div>

      <RejectCourseModal
        open={Boolean(rejectTarget)}
        courseTitle={rejectTarget?.title ?? ""}
        reason={rejectReason}
        loading={Boolean(rejectTarget && actionId === rejectTarget.id)}
        onReasonChange={setRejectReason}
        onConfirm={() => void handleRejectConfirm()}
        onCancel={() => {
          setRejectTarget(null);
          setRejectReason("");
        }}
      />
    </DashboardShell>
  );
}
