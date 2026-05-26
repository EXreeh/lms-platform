"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ModuleWithProgress } from "@/types/learning";
import { formatDuration } from "@/types/course";

interface LessonSidebarProps {
  modules: ModuleWithProgress[];
  activeLessonId: string | null;
  onSelectLesson: (lessonId: string) => void;
}

export function LessonSidebar({ modules, activeLessonId, onSelectLesson }: LessonSidebarProps) {
  return (
    <aside className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-4">
        <h2 className="font-serif text-lg font-bold text-foreground">Course content</h2>
        <p className="mt-1 text-xs text-muted-foreground">Select a lesson to continue</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        {modules.map((mod, mi) => (
          <div key={mod.id} className="mb-4">
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-gold-400">
              Module {mi + 1}: {mod.title}
            </p>
            <ul className="space-y-1">
              {mod.lessons.map((lesson, li) => {
                const active = lesson.id === activeLessonId;
                const done = lesson.progress?.completed;

                return (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      onClick={() => onSelectLesson(lesson.id)}
                      className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                        active
                          ? "bg-green-50 text-green-900 dark:bg-green-950/40 dark:text-green-100"
                          : "hover:bg-muted/60"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          done
                            ? "bg-green-600 text-white"
                            : active
                              ? "bg-gold-500 text-white"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {done ? "✓" : li + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate font-medium ${active ? "" : "text-foreground"}`}>
                          {lesson.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(lesson.duration)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function LessonSidebarMobile({
  modules,
  activeLessonId,
  onSelectLesson,
  open,
  onClose,
}: LessonSidebarProps & { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-border bg-card shadow-2xl lg:hidden"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="font-semibold">Lessons</span>
              <button type="button" onClick={onClose} className="rounded-lg px-3 py-1 text-sm hover:bg-muted">
                Close
              </button>
            </div>
            <LessonSidebar
              modules={modules}
              activeLessonId={activeLessonId}
              onSelectLesson={(id) => {
                onSelectLesson(id);
                onClose();
              }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
