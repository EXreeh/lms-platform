"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AuthNavbar } from "@/components/layout/auth-navbar";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageBackground } from "@/components/layout/page-background";
import { VideoPlayer } from "@/components/learning/video-player";
import { LessonSidebar, LessonSidebarMobile } from "@/components/learning/lesson-sidebar";
import { ProgressBar } from "@/components/learning/progress-bar";
import { LearningPageSkeleton } from "@/components/learning/learning-skeleton";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { fetchCourseProgress, markLessonComplete, updateWatchProgress } from "@/lib/learning-api";
import { fetchCoursePreview } from "@/lib/admin-api";
import { fetchLessonQuizzesStudent } from "@/lib/quizzes-api";
import { fetchCourseResourcesStudent, fetchLessonResourcesStudent } from "@/lib/resources-api";
import { ResourceList } from "@/components/resources/resource-list";
import type { Resource } from "@/types/resource";
import { QuizCard } from "@/components/quizzes/quiz-card";
import type { Quiz } from "@/types/quiz";
import type { CourseProgressData, LessonWithProgress, ModuleWithProgress } from "@/types/learning";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { ApiClientError } from "@/lib/api";
import { getDashboardPathForRole } from "@/lib/auth-storage";
import { layout } from "@/lib/layout";
import { BatchLiveSection } from "@/components/learning/batch-live-section";

function flattenLessons(modules: ModuleWithProgress[]): LessonWithProgress[] {
  return modules.flatMap((m) => m.lessons);
}

export default function CourseLearnPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [data, setData] = useState<CourseProgressData | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lessonQuizzes, setLessonQuizzes] = useState<Quiz[]>([]);
  const [courseResources, setCourseResources] = useState<Resource[]>([]);
  const [lessonResources, setLessonResources] = useState<Resource[]>([]);

  const lessons = useMemo(() => (data ? flattenLessons(data.course.modules) : []), [data]);
  const activeLesson = lessons.find((l) => l.id === activeLessonId) ?? null;
  const activeIndex = lessons.findIndex((l) => l.id === activeLessonId);

  const isAdminPreview = user?.role === "ADMIN";

  const loadProgress = useCallback(async () => {
    try {
      const res = isAdminPreview
        ? await fetchCoursePreview(slug)
        : await fetchCourseProgress(slug);
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
      if (err instanceof ApiClientError) {
        if (err.status === 403) {
          toastError("Only enrolled students can access this lesson.");
          router.replace(`/courses/${slug}?access=denied`);
          return;
        }
        setError(err.message);
      } else {
        setError("Failed to load course");
      }
    } finally {
      setIsLoading(false);
    }
  }, [slug, searchParams, isAdminPreview, router, toastError]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push(`/login?redirect=/courses/${slug}/learn`);
      return;
    }
    if (!user) return;
    if (!isAdminPreview && user.role !== "STUDENT") {
      router.replace(getDashboardPathForRole(user.role));
      return;
    }
    void loadProgress();
  }, [authLoading, isAuthenticated, isAdminPreview, user, router, slug, loadProgress]);

  useEffect(() => {
    if (!data?.course.id || isAdminPreview) return;
    void (async () => {
      try {
        const res = await fetchCourseResourcesStudent(data.course.id);
        setCourseResources(res.data?.resources ?? []);
      } catch {
        setCourseResources([]);
      }
    })();
  }, [data?.course.id, isAdminPreview]);

  useEffect(() => {
    if (!activeLessonId || isAdminPreview) return;
    void (async () => {
      try {
        const [quizRes, resRes] = await Promise.all([
          fetchLessonQuizzesStudent(activeLessonId),
          fetchLessonResourcesStudent(activeLessonId),
        ]);
        setLessonQuizzes(quizRes.data.quizzes);
        setLessonResources(resRes.data?.resources ?? []);
      } catch {
        setLessonQuizzes([]);
        setLessonResources([]);
      }
    })();
  }, [activeLessonId, isAdminPreview]);

  function selectLesson(lessonId: string) {
    setActiveLessonId(lessonId);
    router.replace(`/courses/${slug}/learn?lesson=${lessonId}`, { scroll: false });
  }

  async function handleMarkComplete() {
    if (!activeLessonId || isAdminPreview) return;
    setIsCompleting(true);
    try {
      await markLessonComplete(activeLessonId);
      await loadProgress();
      toastSuccess("Lesson marked complete");
      const next = lessons[activeIndex + 1];
      if (next) selectLesson(next.id);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not mark lesson complete");
    } finally {
      setIsCompleting(false);
    }
  }

  async function handleWatchUpdate(watchedDuration: number) {
    if (!activeLessonId || isAdminPreview) return;
    try {
      await updateWatchProgress(activeLessonId, watchedDuration);
    } catch {
      // silent — watch updates are best-effort
    }
  }

  function goToLesson(index: number) {
    const lesson = lessons[index];
    if (lesson) selectLesson(lesson.id);
  }

  if (authLoading || isLoading) {
    return (
      <PageBackground variant="default">
        <AuthNavbar />
        <main className={`${layout.wide} py-10`}>
          <LearningPageSkeleton />
        </main>
      </PageBackground>
    );
  }

  if (error || !data) {
    return (
      <PageBackground variant="default">
        <AuthNavbar />
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
      <AuthNavbar />
      <main className={`${layout.wide} py-6 lg:py-8`}>
        <Breadcrumbs
          className="mb-4"
          items={[
            { label: "Courses", href: "/courses" },
            { label: data.course.title, href: `/courses/${slug}` },
            { label: "Learn" },
          ]}
        />
        {isAdminPreview && (
          <div className="mb-4 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-sm text-foreground">
            Admin preview — read-only access without enrollment or progress tracking.
          </div>
        )}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            {!isAdminPreview && data.enrollment && (
              <div className="mt-2 max-w-xl">
                <ProgressBar
                  value={data.enrollment.progressPercentage}
                  label={`${data.completedLessons} of ${data.totalLessons} lessons complete`}
                />
                <Link
                  href={`/courses/${slug}/certificate`}
                  className="mt-2 inline-block text-sm font-medium text-green-700 hover:underline dark:text-green-400"
                >
                  View certificate progress →
                </Link>
              </div>
            )}
          </div>
          {!isAdminPreview && (
            <Button
              variant="secondary"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              Lessons ({data.completedLessons}/{data.totalLessons})
            </Button>
          )}
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
                    videoMimeType={activeLesson.videoMimeType}
                    videoFileName={activeLesson.videoFileName}
                    videoStorageProvider={activeLesson.videoStorageProvider}
                    videoStorageKey={activeLesson.videoStorageKey}
                    title={activeLesson.title}
                    duration={activeLesson.duration}
                    initialWatchedDuration={activeLesson.progress?.watchedDuration ?? 0}
                    onWatchUpdate={isAdminPreview ? undefined : handleWatchUpdate}
                  />

                  {!isAdminPreview && data?.course.id ? (
                    <BatchLiveSection courseId={data.course.id} />
                  ) : null}

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

                    {!isAdminPreview && (
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
                    )}
                    {isAdminPreview && (
                      <div className="mt-6 flex flex-wrap gap-3">
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
                    )}

                    {!isAdminPreview && lessonResources.length > 0 && (
                      <div className="mt-8 border-t border-border pt-6">
                        <h3 className="font-serif text-lg font-bold">Lesson resources</h3>
                        <div className="mt-4">
                          <ResourceList resources={lessonResources} />
                        </div>
                      </div>
                    )}

                    {!isAdminPreview && lessonQuizzes.length > 0 && (
                      <div className="mt-8 border-t border-border pt-6">
                        <h3 className="font-serif text-lg font-bold">Lesson quizzes</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Test your knowledge before moving on
                        </p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          {lessonQuizzes.map((quiz) => (
                            <QuizCard
                              key={quiz.id}
                              quiz={quiz}
                              href={`/courses/${slug}/quizzes/${quiz.id}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <p className="text-muted-foreground">Select a lesson to begin.</p>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden rounded-2xl border border-border bg-card lg:block">
            {courseResources.length > 0 && (
              <div className="border-b border-border p-4">
                <h3 className="font-serif text-sm font-bold">Course resources</h3>
                <div className="mt-3">
                  <ResourceList resources={courseResources} />
                </div>
              </div>
            )}
            <LessonSidebar
              modules={data.course.modules}
              activeLessonId={activeLessonId}
              onSelectLesson={selectLesson}
            />
          </div>
        </div>

        <LessonSidebarMobile
          modules={data.course.modules}
          activeLessonId={activeLessonId}
          onSelectLesson={(id) => {
            selectLesson(id);
            setSidebarOpen(false);
          }}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </main>
    </PageBackground>
  );
}
