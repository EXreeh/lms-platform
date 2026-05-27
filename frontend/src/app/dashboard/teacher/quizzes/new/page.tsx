"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { fetchCourse } from "@/lib/courses-api";
import { createQuiz } from "@/lib/quizzes-api";
import type { Course } from "@/types/course";
import { ApiClientError } from "@/lib/api";

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
  const preselectedLesson = searchParams.get("lessonId") ?? "";
  const courseId = searchParams.get("courseId") ?? "";

  const [course, setCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lessonId, setLessonId] = useState(preselectedLesson);
  const [timeLimit, setTimeLimit] = useState("10");
  const [passingScore, setPassingScore] = useState("70");
  const [isLoading, setIsLoading] = useState(Boolean(courseId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    void (async () => {
      try {
        const res = await fetchCourse(courseId, true);
        setCourse(res.data.course);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : "Failed to load course");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [courseId]);

  const lessons =
    course?.modules?.flatMap((m) =>
      m.lessons.map((l) => ({ id: l.id, label: `${m.title} · ${l.title}` })),
    ) ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lessonId || !title.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      const res = await createQuiz({
        title: title.trim(),
        description: description.trim() || undefined,
        lessonId,
        timeLimit: parseInt(timeLimit, 10) * 60 || null,
        passingScore: parseFloat(passingScore) || 70,
      });
      router.push(`/dashboard/teacher/quizzes/${res.data.quiz.id}/edit`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to create quiz");
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
              <Spinner label="Loading course" />
            </div>
          ) : (
            <>
              <Input label="Quiz title" value={title} onChange={(e) => setTitle(e.target.value)} required />
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
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Attach to lesson</label>
                  <select
                    value={lessonId}
                    onChange={(e) => setLessonId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm"
                  >
                    <option value="">Select a lesson</option>
                    {lessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Open from a course with lessons, or pass <code>?courseId=...</code> in the URL.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Time limit (minutes)"
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
                <Button type="submit" variant="gold" disabled={isSaving || !lessonId}>
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
