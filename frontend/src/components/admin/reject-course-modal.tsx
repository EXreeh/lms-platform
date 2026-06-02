"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface RejectCourseModalProps {
  open: boolean;
  courseTitle: string;
  reason: string;
  loading?: boolean;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RejectCourseModal({
  open,
  courseTitle,
  reason,
  loading,
  onReasonChange,
  onConfirm,
  onCancel,
}: RejectCourseModalProps) {
  const trimmed = reason.trim();
  const canSubmit = trimmed.length >= 10;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-title"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl"
          >
            <h2 id="reject-title" className="font-serif text-lg font-bold text-foreground">
              Reject course submission
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Provide feedback for <strong>{courseTitle}</strong>. The teacher will see this reason
              in My Courses.
            </p>
            <div className="mt-4 space-y-1.5">
              <label htmlFor="reject-reason" className="text-sm font-medium">
                Rejection reason
              </label>
              <textarea
                id="reject-reason"
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
                rows={4}
                placeholder="Explain what needs to be improved before resubmission…"
                className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm"
              />
              <p className="text-xs text-muted-foreground">Minimum 10 characters required.</p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
              <Button variant="danger" onClick={onConfirm} disabled={loading || !canSubmit}>
                {loading ? "Rejecting…" : "Reject course"}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
