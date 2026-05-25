"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { ThumbnailInput } from "@/components/courses/thumbnail-input";
import { ModuleAccordion } from "@/components/courses/module-accordion";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  fetchCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  createModule,
  createLesson,
  deleteModule,
  deleteLesson,
  reorderModules,
  reorderLessons,
} from "@/lib/courses-api";
import { COURSE_CATEGORIES, COURSE_LEVELS } from "@/types/course";
import type { Course, CourseLevel } from "@/types/course";
import { ApiClientError } from "@/lib/api";

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [price, setPrice] = useState("0");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState<CourseLevel>("BEGINNER");

  const [moduleTitle, setModuleTitle] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonDuration, setLessonDuration] = useState("0");
  const [selectedModuleId, setSelectedModuleId] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadCourse = useCallback(async () => {
    try {
      const res = await fetchCourse(courseId, true);
      const c = res.data.course;
      setCourse(c);
      setTitle(c.title);
      setDescription(c.description);
      setThumbnail(c.thumbnail ?? "");
      setPrice(String(c.price));
      setCategory(c.category);
      setLevel(c.level);
      if (c.modules?.[0]) setSelectedModuleId(c.modules[0].id);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load course");
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void loadCourse();
  }, [loadCourse]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await updateCourse(courseId, {
        title,
        description,
        thumbnail: thumbnail || "",
        price: parseFloat(price) || 0,
        category,
        level,
      });
      setCourse(res.data.course);
      setSuccess("Course saved successfully");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTogglePublish() {
    if (!course) return;
    setIsSaving(true);
    try {
      const res = await publishCourse(courseId, !course.published);
      setCourse(res.data.course);
      setSuccess(course.published ? "Course unpublished" : "Course published!");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Publish failed");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this course permanently?")) return;
    try {
      await deleteCourse(courseId);
      router.push("/dashboard/teacher");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Delete failed");
    }
  }

  async function handleAddModule(e: React.FormEvent) {
    e.preventDefault();
    if (!moduleTitle.trim()) return;
    try {
      const res = await createModule(courseId, { title: moduleTitle.trim() });
      setCourse(res.data.course);
      setModuleTitle("");
      setSuccess("Module added");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to add module");
    }
  }

  async function moveModule(index: number, direction: "up" | "down") {
    const modules = [...(course?.modules ?? [])].sort((a, b) => a.order - b.order);
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= modules.length) return;
    const ids = modules.map((m) => m.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    const res = await reorderModules(courseId, ids);
    setCourse(res.data.course);
  }

  async function moveLesson(moduleId: string, index: number, direction: "up" | "down") {
    const mod = course?.modules?.find((m) => m.id === moduleId);
    if (!mod) return;
    const lessons = [...mod.lessons].sort((a, b) => a.order - b.order);
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= lessons.length) return;
    const ids = lessons.map((l) => l.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    const res = await reorderLessons(moduleId, ids);
    setCourse(res.data.course);
  }

  async function handleAddLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedModuleId || !lessonTitle.trim()) return;
    try {
      const res = await createLesson(selectedModuleId, {
        title: lessonTitle.trim(),
        description: lessonDescription.trim() || undefined,
        videoUrl: lessonVideoUrl || undefined,
        duration: parseInt(lessonDuration, 10) || 0,
      });
      setCourse(res.data.course);
      setLessonTitle("");
      setLessonDescription("");
      setLessonVideoUrl("");
      setLessonDuration("0");
      setSuccess("Lesson added");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to add lesson");
    }
  }

  if (isLoading) {
    return (
      <DashboardShell title="Edit course" description="" badge="Loading">
        <div className="flex justify-center py-20">
          <Spinner size="lg" label="Loading" />
        </div>
      </DashboardShell>
    );
  }

  if (!course) {
    return (
      <DashboardShell title="Course not found" description="" badge="Error">
        <p className="text-muted-foreground">{error}</p>
        <Link href="/dashboard/teacher" className="mt-4 inline-block">
          <Button variant="secondary">Back to studio</Button>
        </Link>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title={course.title}
      description="Edit details, build curriculum, and publish when ready."
      badge={course.published ? "Published" : "Draft"}
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="TEACHER" />
        <div className="min-w-0 flex-1 space-y-8">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant={course.published ? "secondary" : "gold"}
              onClick={handleTogglePublish}
              disabled={isSaving}
            >
              {course.published ? "Unpublish" : "Publish course"}
            </Button>
            {course.published && (
              <Link href={`/courses/${course.slug}`} target="_blank">
                <Button variant="ghost" size="sm">
                  View live →
                </Button>
              </Link>
            )}
            <Button type="button" variant="ghost" size="sm" onClick={handleDelete} className="text-red-600">
              Delete course
            </Button>
          </div>

          {(error || success) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`rounded-xl px-4 py-3 text-sm ${error ? "bg-red-50 text-red-700 dark:bg-red-950/50" : "bg-green-50 text-green-700 dark:bg-green-950/50"}`}
              role="alert"
            >
              {error ?? success}
            </motion.div>
          )}

          <form onSubmit={handleSave} className="space-y-6 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-serif text-lg font-bold">Course details</h2>
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm"
              />
            </div>
            <ThumbnailInput value={thumbnail} onChange={setThumbnail} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
              <Select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={COURSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
              <Select
                label="Level"
                value={level}
                onChange={(e) => setLevel(e.target.value as CourseLevel)}
                options={COURSE_LEVELS.map((l) => ({ value: l.value, label: l.label }))}
              />
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
          </form>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-serif text-lg font-bold">Curriculum</h2>
            {(course.modules?.length ?? 0) > 1 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {[...(course.modules ?? [])]
                  .sort((a, b) => a.order - b.order)
                  .map((m, i, arr) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs"
                    >
                      <span className="max-w-[8rem] truncate">{m.title}</span>
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => void moveModule(i, "up")}
                        className="px-1 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={i === arr.length - 1}
                        onClick={() => void moveModule(i, "down")}
                        className="px-1 disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>
                  ))}
              </div>
            )}
            <ModuleAccordion
              modules={course.modules ?? []}
              editable
              onDeleteModule={async (id) => {
                if (!confirm("Delete this module and all its lessons?")) return;
                const res = await deleteModule(id);
                setCourse(res.data.course);
              }}
              onDeleteLesson={async (id) => {
                const res = await deleteLesson(id);
                setCourse(res.data.course);
              }}
            />

            <form onSubmit={handleAddModule} className="mt-6 flex gap-3">
              <Input
                label="New module title"
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                className="flex-1"
              />
              <div className="flex items-end">
                <Button type="submit" variant="secondary">
                  Add module
                </Button>
              </div>
            </form>

            {(course.modules?.length ?? 0) > 0 && (
              <form onSubmit={handleAddLesson} className="mt-6 space-y-4 rounded-xl bg-muted/40 p-4">
                <h3 className="text-sm font-semibold">Add lesson</h3>
                <Select
                  label="Module"
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  options={(course.modules ?? []).map((m) => ({ value: m.id, label: m.title }))}
                />
                {selectedModuleId && (course.modules?.find((m) => m.id === selectedModuleId)?.lessons.length ?? 0) > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {(course.modules?.find((m) => m.id === selectedModuleId)?.lessons ?? [])
                      .sort((a, b) => a.order - b.order)
                      .map((l, i, arr) => (
                        <div key={l.id} className="flex items-center gap-1 rounded border px-2 py-1 text-xs">
                          <span className="max-w-[6rem] truncate">{l.title}</span>
                          <button type="button" disabled={i === 0} onClick={() => void moveLesson(selectedModuleId, i, "up")}>↑</button>
                          <button type="button" disabled={i === arr.length - 1} onClick={() => void moveLesson(selectedModuleId, i, "down")}>↓</button>
                        </div>
                      ))}
                  </div>
                )}
                <Input label="Lesson title" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={lessonDescription}
                    onChange={(e) => setLessonDescription(e.target.value)}
                    rows={2}
                    placeholder="What students will learn in this lesson"
                    className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm"
                  />
                </div>
                <Input
                  label="Video URL"
                  value={lessonVideoUrl}
                  onChange={(e) => setLessonVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
                <Input
                  label="Duration (seconds)"
                  type="number"
                  min="0"
                  value={lessonDuration}
                  onChange={(e) => setLessonDuration(e.target.value)}
                />
                <Button type="submit" variant="secondary" size="sm">
                  Add lesson
                </Button>
              </form>
            )}
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
