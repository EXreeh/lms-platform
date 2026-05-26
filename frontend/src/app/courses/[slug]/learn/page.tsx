"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { PageBackground } from "@/components/layout/page-background";
import { VideoPlayer } from "@/components/learning/video-player";
import { LessonSidebar, LessonSidebarMobile } from "@/components/learning/lesson-sidebar";
import { ProgressBar } from "@/components/learning/progress-bar";
import { LearningPageSkeleton } from "@/components/learning/learning-skeleton";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  fetchCourseProgress,
  markLessonComplete,
  updateWatchProgress,
} from "@/lib/learning-api";
import type { CourseProgressData, LessonWithProgress, ModuleWithProgress } from "@/types/learning";
import { useAuth } from "@/context/auth-context";
import { ApiClientError } from "@/lib/api";

function flattenLessons(modules: ModuleWithProgress[]): LessonWithProgress[] {
  return modules.flatMap((m) => m.lessons);
}

export default function CourseLearnPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [data, setData] = useState<CourseProgressData | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lessons = useMemo(() => (data ? flattenLessons(data.course.modules) : []), [data]);
  const activeLesson = lessons.find((l) => l.id === activeLessonId) ?? null;
  const activeIndex = lessons.findIndex((l) => l.id === activeLessonId);

  const loadProgress = useCallback(async () => {
    try {
      const res = await fetchCourseProgress(slug);
      setData(res.data);

      const queryLesson = searchParams.get("lesson");
      const allLessons = flattenLessons(res.data.course.modules);
      setActiveLessonId((current) => {
        if (current && allLessons.some((l) => l.id === current)) return current;
        return (
          (queryLesson && allLessons.find((l) => l.id === queryLesson)?.id) ||
          allLessons.find((l) => !l.progress?.completed)?.id ||
          allLessons[0]?.id ||
          null
        );
      });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load course");
    } finally {
      setIsLoading(false);
    }
  }, [slug, searchParams]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== "STUDENT") {
      router.push(`/login?redirect=/courses/${slug}/learn`);
      return;
    }
    void loadProgress();
  }, [authLoading, isAuthenticated, user?.role, router, slug, loadProgress]);

  async function handleMarkComplete() {
    if (!activeLessonId) return;
    setIsCompleting(true);
    try {
      await markLessonComplete(activeLessonId);
      await loadProgress();
      const next = lessons[activeIndex + 1];
      if (next) setActiveLessonId(next.id);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not mark lesson complete");
    } finally {
      setIsCompleting(false);
    }
  }

  async function handleWatchUpdate(watchedDuration: number) {
    if (!activeLessonId) return;
    try {
      await updateWatchProgress(activeLessonId, watchedDuration);
    } catch {
      // silent — watch updates are best-effort
    }
  }

  function goToLesson(index: number) {
    const lesson = lessons[index];
    if (lesson) setActiveLessonId(lesson.id);
  }

  if (authLoading || isLoading) {
    return (
      <PageBackground variant="default">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <LearningPageSkeleton />
        </main>
      </PageBackground>
    );
  }

  if (error || !data) {
    return (
      <PageBackground variant="default">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="font-serif text-2xl font-bold">Unable to load course</h1>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <Link href={`/courses/${slug}`} className="mt-6 inline-block">
            <Button variant="secondary">Back to course</Button>
          </Link>
        </main>
      </PageBackground>
    );
  }

  return (
    <PageBackground variant="default">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href={`/courses/${slug}`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← {data.course.title}
            </Link>
            <div className="mt-2 max-w-xl">
              <ProgressBar
                value={data.enrollment.progressPercentage}
                label={`${data.completedLessons} of ${data.totalLessons} lessons complete`}
              />
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            Lessons ({data.completedLessons}/{data.totalLessons})
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              {activeLesson ? (
                <motion.div
                  key={activeLesson.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <VideoPlayer
                    videoUrl={activeLesson.videoUrl}
                    title={activeLesson.title}
                    duration={activeLesson.duration}
                    initialWatchedDuration={activeLesson.progress?.watchedDuration ?? 0}
                    onWatchUpdate={handleWatchUpdate}
                    onComplete={() => {
                      if (!activeLesson.progress?.completed) void handleMarkComplete();
                    }}
                  />

                  <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h1 className="font-serif text-2xl font-bold text-foreground">
                          {activeLesson.title}
                        </h1>
                        {activeLesson.description && (
                          <p className="mt-3 leading-relaxed text-muted-foreground">
                            {activeLesson.description}
                          </p>
                        )}
                      </div>
                      {activeLesson.progress?.completed && (
                        <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white">
                          ✓ Completed
                        </span>
                      )}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button
                        variant="gold"
                        onClick={() => void handleMarkComplete()}
                        disabled={isCompleting || activeLesson.progress?.completed}
                      >
                        {isCompleting ? (
                          <Spinner size="sm" />
                        ) : activeLesson.progress?.completed ? (
                          "Lesson completed"
                        ) : (
                          "Mark as complete"
                        )}
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={activeIndex <= 0}
                        onClick={() => goToLesson(activeIndex - 1)}
                      >
                        ← Previous
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={activeIndex >= lessons.length - 1}
                        onClick={() => goToLesson(activeIndex + 1)}
                      >
                        Next →
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <p className="text-muted-foreground">Select a lesson to begin.</p>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden rounded-2xl border border-border bg-card lg:block">
            <LessonSidebar
              modules={data.course.modules}
              activeLessonId={activeLessonId}
              onSelectLesson={setActiveLessonId}
            />
          </div>
        </div>

        <LessonSidebarMobile
          modules={data.course.modules}
          activeLessonId={activeLessonId}
          onSelectLesson={setActiveLessonId}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </main>
    </PageBackground>
  );
}
