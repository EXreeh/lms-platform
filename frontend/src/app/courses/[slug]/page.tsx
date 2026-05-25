"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { PageBackground } from "@/components/layout/page-background";
import { ModuleAccordion } from "@/components/courses/module-accordion";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { fetchCourse, enrollInCourse } from "@/lib/courses-api";
import type { Course } from "@/types/course";
import { formatPrice, formatDuration } from "@/types/course";
import { ApiClientError } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const slug = params.slug as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollMsg, setEnrollMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetchCourse(slug, isAuthenticated);
        setCourse(res.data.course);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : "Course not found");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [slug, isAuthenticated]);

  const totalDuration =
    course?.modules?.reduce(
      (sum, m) => sum + m.lessons.reduce((ls, l) => ls + l.duration, 0),
      0,
    ) ?? 0;

  async function handleEnroll() {
    if (!course) return;
    if (!isAuthenticated) {
      router.push(`/login?redirect=/courses/${slug}`);
      return;
    }
    if (user?.role !== "STUDENT") {
      setEnrollMsg("Only students can enroll. Sign in with a student account.");
      return;
    }
    setIsEnrolling(true);
    setEnrollMsg(null);
    try {
      await enrollInCourse(course.slug);
      router.push("/dashboard/student");
    } catch (err) {
      setEnrollMsg(err instanceof ApiClientError ? err.message : "Enrollment failed");
    } finally {
      setIsEnrolling(false);
    }
  }

  return (
    <PageBackground variant="default">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Spinner size="lg" label="Loading course" />
          </div>
        ) : error || !course ? (
          <div className="py-20 text-center">
            <h1 className="font-serif text-2xl font-bold">Course not found</h1>
            <p className="mt-2 text-muted-foreground">{error}</p>
            <Link href="/courses" className="mt-6 inline-block">
              <Button variant="secondary">Browse courses</Button>
            </Link>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid gap-10 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="relative mb-6 aspect-video overflow-hidden rounded-2xl bg-muted">
                  {course.thumbnail ? (
                    <Image
                      src={course.thumbnail}
                      alt=""
                      fill
                      className="object-cover"
                      priority
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center gradient-brand">
                      <span className="font-serif text-5xl font-bold text-white/80">
                        {course.title.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-green-700 dark:text-gold-400">
                  {course.category} · {course.level}
                </span>
                <h1 className="mt-2 font-serif text-3xl font-bold text-foreground sm:text-4xl">
                  {course.title}
                </h1>
                {course.teacher && (
                  <p className="mt-3 text-muted-foreground">
                    Taught by <span className="font-medium text-foreground">{course.teacher.name}</span>
                  </p>
                )}
                <p className="mt-6 leading-relaxed text-muted-foreground">{course.description}</p>

                <h2 className="mt-10 font-serif text-xl font-bold text-foreground">
                  Course content
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {course.modules?.length ?? 0} modules · {course.lessonCount ?? 0} lessons ·{" "}
                  {formatDuration(totalDuration)} total
                </p>
                <div className="mt-6">
                  <ModuleAccordion modules={course.modules ?? []} />
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-lg">
                  <p className="text-3xl font-bold text-foreground">{formatPrice(course.price)}</p>
                  {course.enrolled ? (
                    <>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full gradient-brand"
                          style={{ width: `${course.enrollmentProgress ?? 0}%` }}
                        />
                      </div>
                      <p className="mt-2 text-center text-xs text-muted-foreground">
                        {Math.round(course.enrollmentProgress ?? 0)}% complete
                      </p>
                      <Link href="/dashboard/student" className="mt-4 block">
                        <Button className="w-full" size="lg" variant="gold">
                          Continue learning
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Button
                        className="mt-4 w-full"
                        size="lg"
                        variant="gold"
                        onClick={handleEnroll}
                        disabled={isEnrolling}
                      >
                        {isEnrolling ? "Enrolling…" : "Enroll now"}
                      </Button>
                      {enrollMsg ? (
                        <p className="mt-2 text-center text-xs text-red-600 dark:text-red-400" role="alert">
                          {enrollMsg}
                        </p>
                      ) : (
                        <p className="mt-2 text-center text-xs text-muted-foreground">
                          Full access after enrollment
                        </p>
                      )}
                    </>
                  )}
                  <ul className="mt-6 space-y-3 border-t border-border pt-6 text-sm text-muted-foreground">
                    <li className="flex justify-between">
                      <span>Level</span>
                      <span className="font-medium text-foreground">{course.level}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Lessons</span>
                      <span className="font-medium text-foreground">{course.lessonCount ?? 0}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Modules</span>
                      <span className="font-medium text-foreground">{course.moduleCount ?? 0}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </PageBackground>
  );
}
