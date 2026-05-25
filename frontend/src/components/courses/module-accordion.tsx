"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Module } from "@/types/course";
import { LessonList } from "./lesson-list";

interface ModuleAccordionProps {
  modules: Module[];
  editable?: boolean;
  onDeleteModule?: (moduleId: string) => void;
  onDeleteLesson?: (lessonId: string) => void;
}

export function ModuleAccordion({
  modules,
  editable,
  onDeleteModule,
  onDeleteLesson,
}: ModuleAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(modules[0]?.id ?? null);

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
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-700/10 text-sm font-bold text-green-700 dark:bg-green-400/10 dark:text-green-400">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold text-foreground">{module.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {module.lessons.length} lesson{module.lessons.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
