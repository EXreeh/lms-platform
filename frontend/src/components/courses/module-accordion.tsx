"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Module } from "@/types/course";
import { LessonList } from "./lesson-list";

interface ModuleAccordionProps {
  modules: Module[];
  /** Expand this module (e.g. after adding a lesson) */
  openModuleId?: string | null;
  editable?: boolean;
  onDeleteModule?: (moduleId: string) => void;
  onDeleteLesson?: (lessonId: string) => void;
  onUpdateModule?: (moduleId: string, title: string) => void | Promise<void>;
  onUpdateLesson?: (
    lessonId: string,
    data: { title: string; description?: string; videoUrl?: string; duration?: number },
  ) => void | Promise<void>;
}

export function ModuleAccordion({
  modules,
  openModuleId,
  editable,
  onDeleteModule,
  onDeleteLesson,
  onUpdateModule,
  onUpdateLesson,
}: ModuleAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(modules[0]?.id ?? null);

  useEffect(() => {
    if (openModuleId) setOpenId(openModuleId);
  }, [openModuleId]);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleEditTitle, setModuleEditTitle] = useState("");

  if (modules.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No modules yet. Add your first module to structure this course.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {modules.map((module, index) => {
        const isOpen = openId === module.id;
        return (
          <div
            key={module.id}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : module.id)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-700/10 text-sm font-bold text-green-700 dark:bg-green-400/10 dark:text-green-400">
                  {index + 1}
                </span>
                {editable && onUpdateModule && editingModuleId === module.id ? (
                  <form
                    className="flex min-w-0 flex-1 items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!moduleEditTitle.trim()) return;
                      void Promise.resolve(
                        onUpdateModule(module.id, moduleEditTitle.trim()),
                      ).then(() => {
                        setEditingModuleId(null);
                      });
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      value={moduleEditTitle}
                      onChange={(e) => setModuleEditTitle(e.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-border px-2 py-1 text-sm"
                      autoFocus
                    />
                    <button type="submit" className="text-xs font-medium text-green-700">Save</button>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingModuleId(null);
                      }}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div>
                    <p className="font-semibold text-foreground">{module.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {module.lessons.length} lesson{module.lessons.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {editable && onUpdateModule && editingModuleId !== module.id && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingModuleId(module.id);
                      setModuleEditTitle(module.title);
                    }}
                    className="rounded-lg px-2 py-1 text-xs hover:bg-muted"
                  >
                    Edit
                  </button>
                )}
                {editable && onDeleteModule && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteModule(module.id);
                    }}
                    className="rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    Delete
                  </button>
                )}
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  className="text-muted-foreground"
                  aria-hidden
                >
                  ▾
                </motion.span>
              </div>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden border-t border-border"
                >
                  <div className="p-4 pt-2">
                    <LessonList
                      lessons={module.lessons}
                      editable={editable}
                      onDeleteLesson={onDeleteLesson}
                      onUpdateLesson={onUpdateLesson}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
