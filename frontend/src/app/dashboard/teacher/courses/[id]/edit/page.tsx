"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { ThumbnailInput } from "@/components/courses/thumbnail-input";
import { LessonVideoField, type LessonVideoValue } from "@/components/courses/lesson-video-field";
import { ModuleAccordion } from "@/components/courses/module-accordion";
import { CourseResourcesSection } from "@/components/courses/course-resources-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  fetchCourse,
  updateCourse,
  deleteCourse,
  submitCourseForReview,
  createModule,
  createLesson,
  deleteModule,
  deleteLesson,
  reorderModules,
  reorderLessons,
  updateModule,
  updateLesson,
} from "@/lib/courses-api";
import { COURSE_CATEGORIES, COURSE_LEVELS, COURSE_STATUS_LABELS } from "@/types/course";
import type { Course, CourseLevel, CourseStatus } from "@/types/course";
import { ApiClientError } from "@/lib/api";
import { formatApiError } from "@/lib/format-api-error";
import { activeCurriculumModules, countActiveLessons } from "@/lib/course-curriculum";
import { logLessonDebug } from "@/lib/lesson-debug";
import { hasUploadedVideo, resolveVideoPlaybackUrl } from "@/lib/video-upload-utils";
import { useToast } from "@/context/toast-context";

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const { success: toastSuccess, error: toastError } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [thumbnailFileName, setThumbnailFileName] = useState<string | null>(null);
  const [price, setPrice] = useState("0");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState<CourseLevel>("BEGINNER");

  const [moduleTitle, setModuleTitle] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [lessonVideo, setLessonVideo] = useState<LessonVideoValue>({
    videoUrl: "",
    videoFileName: null,
    videoMimeType: null,
    videoSize: null,
    videoStorageProvider: null,
    videoStorageKey: null,
  });
  const [addingLesson, setAddingLesson] = useState(false);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
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
      setThumbnailFileName(c.thumbnailFileName ?? null);
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
        thumbnailFileName: thumbnailFileName || undefined,
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

  async function handleSubmitForReview() {
    if (!course) return;
    const lessonCount = countActiveLessons(course);
    if (lessonCount === 0) {
      toastError("Add at least one lesson before submitting for review");
      return;
    }
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await submitCourseForReview(courseId);
      setCourse(res.data.course);
      setSuccess("Course submitted for admin review");
      toastSuccess("Course submitted for admin review");
      await loadCourse();
    } catch (err) {
      const msg = formatApiError(err, "Submit failed");
      setError(msg);
      toastError(msg);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Request deletion? An admin must approve before the course is removed.")) return;
    try {
      const res = await deleteCourse(courseId);
      if (res.pendingApproval) {
        setSuccess(res.message);
        toastSuccess(res.message);
        await loadCourse();
      } else {
        router.push("/dashboard/teacher");
      }
    } catch (err) {
      const msg = formatApiError(err, "Delete failed");
      setError(msg);
      toastError(msg);
    }
  }

  const status = (course?.status ?? "DRAFT") as CourseStatus;
  const canSubmit = status === "DRAFT" || status === "REJECTED";
  const isLocked = status === "UNDER_REVIEW" || status === "ARCHIVED";

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
    setError(null);

    if (!lessonTitle.trim()) {
      const msg = "Lesson title is required.";
      setError(msg);
      toastError(msg);
      return;
    }
    if (!selectedModuleId) {
      const msg = "Please select a module for this lesson.";
      setError(msg);
      toastError(msg);
      return;
    }

    const resolvedVideoUrl =
      resolveVideoPlaybackUrl(lessonVideo) ?? (lessonVideo.videoUrl.trim() || undefined);

    const payload = {
      title: lessonTitle.trim(),
      description: lessonDescription.trim() || undefined,
      videoUrl: resolvedVideoUrl,
      videoFileName: lessonVideo.videoFileName ?? undefined,
      videoMimeType: lessonVideo.videoMimeType ?? undefined,
      videoSize: lessonVideo.videoSize ?? undefined,
      videoStorageProvider:
        lessonVideo.videoStorageProvider ??
        (lessonVideo.videoStorageKey || resolvedVideoUrl?.includes("media.cognitiaxai.com")
          ? "r2"
          : undefined),
      videoStorageKey: lessonVideo.videoStorageKey ?? undefined,
      duration: parseInt(lessonDuration, 10) || 0,
    };

    console.info("[CognitiaX lesson] create payload", {
      moduleId: selectedModuleId,
      ...payload,
      hasUploadedVideo: hasUploadedVideo(lessonVideo),
    });
    logLessonDebug("create payload", {
      moduleId: selectedModuleId,
      ...payload,
      hasUploadedVideo: hasUploadedVideo(lessonVideo),
    });

    setAddingLesson(true);
    try {
      const res = await createLesson(selectedModuleId, payload);
      const savedModule = res.data.course.modules?.find((m) => m.id === selectedModuleId);
      const savedLesson = savedModule?.lessons?.[savedModule.lessons.length - 1];
      logLessonDebug("create response", {
        courseId: res.data.course.id,
        moduleCount: res.data.course.modules?.length,
        savedVideoUrl: savedLesson?.videoUrl,
        savedVideoMimeType: savedLesson?.videoMimeType,
        savedVideoStorageKey: savedLesson?.videoStorageKey,
        savedVideoStorageProvider: savedLesson?.videoStorageProvider,
      });
      setCourse(res.data.course);
      setExpandedModuleId(selectedModuleId);
      setLessonTitle("");
      setLessonDescription("");
      setLessonVideo({
        videoUrl: "",
        videoFileName: null,
        videoMimeType: null,
        videoSize: null,
        videoStorageProvider: null,
        videoStorageKey: null,
      });
      setLessonDuration("0");
      setSuccess("Lesson added successfully");
      toastSuccess("Lesson added successfully");
    } catch (err) {
      const msg = formatApiError(err, "Failed to add lesson");
      setError(msg);
      toastError(msg);
      logLessonDebug("create error", { message: msg });
    } finally {
      setAddingLesson(false);
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
      badge={COURSE_STATUS_LABELS[status]}
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="TEACHER" />
        <div className="min-w-0 flex-1 space-y-8">
          <div className="flex flex-wrap items-center gap-3">
            {canSubmit && (
              <Button type="button" variant="gold" onClick={() => void handleSubmitForReview()} disabled={isSaving}>
                Submit for review
              </Button>
            )}
            {status === "UNDER_REVIEW" && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Awaiting admin approval
              </span>
            )}
            {course.published && (
              <Link href={`/courses/${course.slug}`} target="_blank">
                <Button variant="ghost" size="sm">View in catalog →</Button>
              </Link>
            )}
            {!isLocked && (
              <Button type="button" variant="ghost" size="sm" onClick={() => void handleDelete()} className="text-red-600">
                Request deletion
              </Button>
            )}
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

          {status === "REJECTED" && course.rejectionReason && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 dark:border-red-900 dark:bg-red-950/40">
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">Course rejected by admin</p>
              <p className="mt-2 text-sm text-red-700 dark:text-red-200">{course.rejectionReason}</p>
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                Update your course and submit for review again when ready.
              </p>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-serif text-lg font-bold">Course details</h2>
            {isLocked && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                This course is locked while under review or archived.
              </p>
            )}
            <fieldset disabled={isLocked} className="space-y-6 disabled:opacity-60">
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
            <ThumbnailInput
              value={thumbnail}
              thumbnailFileName={thumbnailFileName}
              onChange={(url, meta) => {
                setThumbnail(url);
                setThumbnailFileName(meta?.fileName ?? null);
              }}
              disabled={isLocked}
            />
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
            <Button type="submit" disabled={isSaving || isLocked}>
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
            </fieldset>
          </form>

          <section className={`rounded-2xl border border-border bg-card p-6 ${isLocked ? "opacity-60 pointer-events-none" : ""}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-lg font-bold">Curriculum</h2>
              <Link
                href={`/dashboard/teacher/quizzes/new?courseId=${courseId}`}
              >
                <Button type="button" variant="ghost" size="sm">
                  + Add quiz to lesson
                </Button>
              </Link>
            </div>
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
              modules={activeCurriculumModules(course.modules)}
              openModuleId={expandedModuleId}
              editable
              onUpdateModule={async (id, title) => {
                const res = await updateModule(id, { title });
                setCourse(res.data.course);
                setSuccess("Module updated");
                toastSuccess("Module updated");
              }}
              onUpdateLesson={async (id, data) => {
                const res = await updateLesson(id, data);
                setCourse(res.data.course);
                setSuccess("Lesson updated");
                toastSuccess("Lesson updated");
              }}
              onDeleteModule={async (id) => {
                if (!confirm("Request module deletion? An admin must approve.")) return;
                const res = await deleteModule(id);
                setCourse(res.data.course);
                const msg = res.message ?? (res.pendingApproval ? "Delete request submitted" : "Module deleted");
                setSuccess(msg);
                toastSuccess(msg);
              }}
              onDeleteLesson={async (id) => {
                if (!confirm("Request lesson deletion? An admin must approve.")) return;
                const res = await deleteLesson(id);
                setCourse(res.data.course);
                const msg = res.message ?? (res.pendingApproval ? "Delete request submitted" : "Lesson deleted");
                setSuccess(msg);
                toastSuccess(msg);
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
                <Input
                  label="Lesson title"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  required
                />
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
                <LessonVideoField
                  value={lessonVideo}
                  onChange={setLessonVideo}
                  onDurationDetected={(seconds) => setLessonDuration(String(seconds))}
                />
                <Input
                  label="Duration (seconds)"
                  type="number"
                  min="0"
                  value={lessonDuration}
                  onChange={(e) => setLessonDuration(e.target.value)}
                />
                <Button type="submit" variant="secondary" size="sm" disabled={addingLesson}>
                  {addingLesson ? "Adding lesson…" : "Add lesson"}
                </Button>
              </form>
            )}
          </section>

          <CourseResourcesSection course={course} disabled={isLocked} />
        </div>
      </div>
    </DashboardShell>
  );
}
