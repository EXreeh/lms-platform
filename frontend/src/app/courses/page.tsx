"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/navbar";
import { PageBackground } from "@/components/layout/page-background";
import { PageTransition } from "@/components/motion/page-transition";
import { CourseCard } from "@/components/courses/course-card";
import { EmptyState } from "@/components/courses/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { fetchCourses, fetchCategories } from "@/lib/courses-api";
import { useAuth } from "@/context/auth-context";
import { COURSE_LEVELS } from "@/types/course";
import type { Course, CourseLevel } from "@/types/course";
import { brand } from "@/lib/design-tokens";
import { ApiClientError } from "@/lib/api";
import { layout } from "@/lib/layout";
import { SiteFooter } from "@/components/layout/site-footer";

export default function CoursesPage() {
  const { user, isAuthenticated } = useAuth();
  const isStudent = isAuthenticated && user?.role === "STUDENT";
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState<CourseLevel | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchCourses(
        {
          search: search || undefined,
          category: category || undefined,
          level: level || undefined,
        },
        isStudent,
      );
      setCourses(res.data.courses);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not load courses. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  }, [search, category, level, isStudent]);

  useEffect(() => {
    void fetchCategories()
      .then((r) => setCategories(r.data.categories))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void loadCourses(), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [loadCourses, search]);

  return (
    <PageBackground variant="default">
      <Navbar />
      <main className={`${layout.page} py-10`}>
        <PageTransition>
          <div className="mb-10">
            <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
              {isStudent ? "My assigned courses" : "Explore courses"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {isStudent
                ? "Courses assigned to you by your institute. Contact admin for new access."
                : `Discover AI-powered learning paths from expert educators on ${brand.name}.`}
            </p>
          </div>

          <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-[200px] flex-1">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Search
              </label>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses…"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/25"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as CourseLevel | "")}
                className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm"
              >
                <option value="">All levels</option>
                {COURSE_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" label="Loading courses" />
            </div>
          ) : error ? (
            <EmptyState
              title="Something went wrong"
              description={error}
              icon="⚠️"
              action={
                <Button onClick={() => void loadCourses()} variant="secondary">
                  Try again
                </Button>
              }
            />
          ) : courses.length === 0 ? (
            <EmptyState
              title="No courses found"
              description="Try adjusting your filters or check back soon for new content."
              icon="🔍"
            />
          ) : (
            <motion.div
              layout
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {courses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <CourseCard course={course} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </PageTransition>
      </main>
      <SiteFooter />
    </PageBackground>
  );
}
