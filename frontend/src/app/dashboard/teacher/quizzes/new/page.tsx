"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Select } from "@/components/ui/select";
import { fetchCourse, fetchCourses } from "@/lib/courses-api";
import { createQuiz } from "@/lib/quizzes-api";
import { activeCurriculumModules } from "@/lib/course-curriculum";
import { formatApiError } from "@/lib/format-api-error";
import type { Course } from "@/types/course";
import { useToast } from "@/context/toast-context";

export default function NewQuizPage() {
  return (
    <Suspense
      fallback={
        <DashboardShell title="Create quiz" description="" badge="Loading">
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        </DashboardShell>
      }
    >
      <NewQuizForm />
    </Suspense>
  );
}

function NewQuizForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { error: toastError, success: toastSuccess } = useToast();
  const preselectedLesson = searchParams.get("lessonId") ?? "";
  const courseId = searchParams.get("courseId") ?? "";

  const [course, setCourse] = useState<Course | null>(null);
  const [teacherCourses, setTeacherCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(courseId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lessonId, setLessonId] = useState(preselectedLesson);
  const [timeLimit, setTimeLimit] = useState("10");
  const [passingScore, setPassingScore] = useState("70");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetchCourses({ mine: true }, true);
        const editable = res.data.courses.filter(
          (c) => c.status !== "ARCHIVED" && c.deleteStatus !== "PENDING_DELETE",
        );
        setTeacherCourses(editable);

        const targetId = courseId || editable[0]?.id || "";
        setSelectedCourseId(targetId);
        if (targetId) {
          const courseRes = await fetchCourse(targetId, true);
          setCourse(courseRes.data.course);
        }
      } catch (err) {
        const msg = formatApiError(err, "Failed to load courses");
        setError(msg);
        toastError(msg);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [courseId, toastError]);

  async function handleCourseChange(id: string) {
    setSelectedCourseId(id);
    setLessonId("");
    if (!id) {
      setCourse(null);
      return;
    }
    try {
      const res = await fetchCourse(id, true);
      setCourse(res.data.course);
    } catch (err) {
      toastError(formatApiError(err, "Failed to load course"));
    }
  }

  const lessons = activeCurriculumModules(course?.modules).flatMap((m) =>
    m.lessons.map((l) => ({ id: l.id, label: `${m.title} · ${l.title}` })),
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lessonId || !title.trim()) {
      toastError("Select a lesson and enter a quiz title (min 3 characters)");
      return;
    }
    if (title.trim().length < 3) {
      toastError("Quiz title must be at least 3 characters");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const minutes = parseInt(timeLimit, 10);
      const res = await createQuiz({
        title: title.trim(),
        description: description.trim() || undefined,
        lessonId,
        timeLimit: Number.isFinite(minutes) && minutes > 0 ? minutes * 60 : null,
        passingScore: parseFloat(passingScore) || 70,
      });
      toastSuccess("Quiz created — add questions next");
      router.push(`/dashboard/teacher/quizzes/${res.data.quiz.id}/edit`);
    } catch (err) {
      const msg = formatApiError(err, "Failed to create quiz");
      setError(msg);
      toastError(msg);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <DashboardShell title="Create quiz" description="Set up a new MCQ assessment." badge="New quiz">
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="TEACHER" />
        <form onSubmit={handleSubmit} className="max-w-xl flex-1 space-y-6 rounded-2xl border border-border bg-card p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner label="Loading courses" />
            </div>
          ) : (
            <>
              {teacherCourses.length > 0 && (
                <Select
                  label="Course"
                  value={selectedCourseId}
                  onChange={(e) => void handleCourseChange(e.target.value)}
                  options={teacherCourses.map((c) => ({
                    value: c.id,
                    label: `${c.title} (${c.status})`,
                  }))}
                />
              )}
              <Input label="Quiz title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} />
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm"
                />
              </div>
              {lessons.length > 0 ? (
                <Select
                  label="Attach to lesson"
                  value={lessonId}
                  onChange={(e) => setLessonId(e.target.value)}
                  options={[{ value: "", label: "Select a lesson" }, ...lessons.map((l) => ({ value: l.id, label: l.label }))]}
                />
              ) : (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  This course has no lessons yet. Add modules and lessons in the course editor first.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Time limit (minutes, optional)"
                  type="number"
                  min="1"
                  max="120"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                />
                <Input
                  label="Passing score (%)"
                  type="number"
                  min="0"
                  max="100"
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3">
                <Button type="submit" variant="gold" disabled={isSaving || !lessonId || lessons.length === 0}>
                  {isSaving ? "Creating…" : "Create & add questions"}
                </Button>
                <Link href="/dashboard/teacher/quizzes">
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </Link>
              </div>
            </>
          )}
        </form>
      </div>
    </DashboardShell>
  );
}
