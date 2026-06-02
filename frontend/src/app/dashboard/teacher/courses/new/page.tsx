"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { ThumbnailInput } from "@/components/courses/thumbnail-input";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { createCourse } from "@/lib/courses-api";
import { COURSE_CATEGORIES, COURSE_LEVELS } from "@/types/course";
import type { CourseLevel } from "@/types/course";
import { ApiClientError } from "@/lib/api";

export default function NewCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [thumbnailFileName, setThumbnailFileName] = useState<string | null>(null);
  const [price, setPrice] = useState("0");
  const [category, setCategory] = useState<string>(COURSE_CATEGORIES[0]);
  const [level, setLevel] = useState<CourseLevel>("BEGINNER");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await createCourse({
        title,
        description,
        thumbnail: thumbnail || undefined,
        thumbnailFileName: thumbnailFileName || undefined,
        price: parseFloat(price) || 0,
        category,
        level,
      });
      router.push(`/dashboard/teacher/courses/${res.data.course.id}/edit`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to create course");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <DashboardShell
      title="Create course"
      description="Set up the basics — you'll add modules and lessons next."
      badge="New course"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="TEACHER" />
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="min-w-0 flex-1 space-y-6 rounded-2xl border border-border bg-card p-6 sm:p-8"
        >
          <Input
            label="Course title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
            disabled={isLoading}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={10}
              rows={5}
              disabled={isLoading}
              className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/25"
            />
          </div>
          <ThumbnailInput
            value={thumbnail}
            thumbnailFileName={thumbnailFileName}
            onChange={(url, meta) => {
              setThumbnail(url);
              setThumbnailFileName(meta?.fileName ?? null);
            }}
            disabled={isLoading}
          />
          <div className="grid gap-5 sm:grid-cols-3">
            <Input
              label="Price (USD)"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={isLoading}
            />
            <Select
              label="Category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isLoading}
              options={COURSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
            <Select
              label="Level"
              name="level"
              value={level}
              onChange={(e) => setLevel(e.target.value as CourseLevel)}
              disabled={isLoading}
              options={COURSE_LEVELS.map((l) => ({ value: l.value, label: l.label }))}
            />
          </div>
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" variant="gold" disabled={isLoading}>
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size="sm" label="Creating" />
                Creating…
              </span>
            ) : (
              "Create & continue"
            )}
          </Button>
        </motion.form>
      </div>
    </DashboardShell>
  );
}
