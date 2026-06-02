"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  fetchQuiz,
  updateQuiz,
  deleteQuiz,
  addQuestion,
  deleteQuestion,
  updateQuestion,
  fetchQuizAnalytics,
} from "@/lib/quizzes-api";
import type { Quiz, QuizAnalytics } from "@/types/quiz";
import { ApiClientError } from "@/lib/api";
import { formatApiError } from "@/lib/format-api-error";
import { useToast } from "@/context/toast-context";

export default function EditQuizPage() {
  const params = useParams();
  const quizId = params.quizId as string;
  const { success: toastSuccess, error: toastError } = useToast();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [passingScore, setPassingScore] = useState("70");

  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [points, setPoints] = useState("1");

  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editOptions, setEditOptions] = useState(["", "", "", ""]);
  const [editCorrectAnswer, setEditCorrectAnswer] = useState("");
  const [editPoints, setEditPoints] = useState("1");
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const quizRes = await fetchQuiz(quizId);
      const q = quizRes.data.quiz;
      setQuiz(q);
      setTitle(q.title);
      setDescription(q.description ?? "");
      setTimeLimit(q.timeLimit ? String(Math.floor(q.timeLimit / 60)) : "");
      setPassingScore(String(q.passingScore));
      try {
        const analyticsRes = await fetchQuizAnalytics(quizId);
        setAnalytics(analyticsRes.data);
      } catch {
        setAnalytics(null);
      }
    } catch (err) {
      const msg = formatApiError(err, "Failed to load quiz");
      setError(msg);
      toastError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await updateQuiz(quizId, {
        title,
        description,
        timeLimit: timeLimit ? parseInt(timeLimit, 10) * 60 : null,
        passingScore: parseFloat(passingScore),
      });
      setQuiz(res.data.quiz);
      setSuccess("Quiz settings saved");
    } catch (err) {
      toastError(formatApiError(err, "Save failed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!questionText.trim() || validOptions.length < 2 || !correctAnswer) {
      toastError("Enter a question (min 5 chars), at least 2 options, and select the correct answer");
      return;
    }
    if (questionText.trim().length < 5) {
      toastError("Question text must be at least 5 characters");
      return;
    }
    if (!validOptions.includes(correctAnswer)) {
      toastError("Correct answer must match one of the options");
      return;
    }
    try {
      await addQuestion(quizId, {
        question: questionText.trim(),
        options: validOptions,
        correctAnswer,
        points: parseInt(points, 10) || 1,
      });
      setQuestionText("");
      setOptions(["", "", "", ""]);
      setCorrectAnswer("");
      setSuccess("Question added");
      toastSuccess("Question added");
      await load();
    } catch (err) {
      const msg = formatApiError(err, "Failed to add question");
      setError(msg);
      toastError(msg);
    }
  }

  async function handleDeleteQuestion(id: string) {
    if (!confirm("Delete this question?")) return;
    await deleteQuestion(id);
    if (editingQuestionId === id) setEditingQuestionId(null);
    await load();
  }

  function startEditQuestion(q: NonNullable<Quiz["questions"]>[number]) {
    setEditingQuestionId(q.id);
    setEditQuestionText(q.question);
    const opts = [...q.options];
    while (opts.length < 4) opts.push("");
    setEditOptions(opts.slice(0, 4));
    setEditCorrectAnswer(q.correctAnswer ?? "");
    setEditPoints(String(q.points));
  }

  function cancelEditQuestion() {
    setEditingQuestionId(null);
  }

  async function handleSaveQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!editingQuestionId) return;
    const validOptions = editOptions.map((o) => o.trim()).filter(Boolean);
    if (!editQuestionText.trim() || validOptions.length < 2 || !editCorrectAnswer) {
      toastError("Please complete all required fields.");
      return;
    }
    if (editQuestionText.trim().length < 5) {
      toastError("Question text must be at least 5 characters");
      return;
    }
    if (!validOptions.includes(editCorrectAnswer)) {
      toastError("Correct answer must match one of the options");
      return;
    }
    setIsSavingQuestion(true);
    try {
      await updateQuestion(editingQuestionId, {
        question: editQuestionText.trim(),
        options: validOptions,
        correctAnswer: editCorrectAnswer,
        points: parseInt(editPoints, 10) || 1,
      });
      setEditingQuestionId(null);
      toastSuccess("Question updated");
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Failed to update question"));
    } finally {
      setIsSavingQuestion(false);
    }
  }

  async function handleDeleteQuiz() {
    if (!confirm("Request quiz deletion? Admin approval required.")) return;
    const res = await deleteQuiz(quizId);
    if (res.pendingApproval) {
      setSuccess(res.message);
    } else {
      window.location.href = "/dashboard/teacher/quizzes";
    }
  }

  if (isLoading) {
    return (
      <DashboardShell title="Edit quiz" description="" badge="Loading">
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </DashboardShell>
    );
  }

  if (!quiz) {
    return (
      <DashboardShell title="Quiz not found" description="" badge="Error">
        <p>{error}</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={quiz.title} description="Manage questions and view analytics." badge="Quiz editor">
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="TEACHER" />
        <div className="min-w-0 flex-1 space-y-8">
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/teacher/quizzes">
              <Button variant="secondary" size="sm">
                ← All quizzes
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => void handleDeleteQuiz()} className="text-red-600">
              Delete quiz
            </Button>
          </div>

          {(error || success) && (
            <p className={`text-sm ${error ? "text-red-600" : "text-green-600"}`}>{error ?? success}</p>
          )}

          {analytics && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Attempts" value={analytics.stats.totalAttempts} icon="📊" />
              <StatCard label="Pass rate" value={`${analytics.stats.passRate}%`} icon="✓" accent="green" />
              <StatCard label="Avg score" value={`${analytics.stats.averageScore}%`} icon="◎" accent="gold" />
              <StatCard label="Questions" value={quiz.questionCount} icon="?" />
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <h2 className="font-serif text-lg font-bold">Quiz settings</h2>
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Time limit (min)" type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} />
              <Input label="Passing %" type="number" value={passingScore} onChange={(e) => setPassingScore(e.target.value)} />
            </div>
            <Button type="submit" disabled={isSaving}>
              Save settings
            </Button>
          </form>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-serif text-lg font-bold">Questions ({quiz.questions?.length ?? 0})</h2>
            <ul className="mt-4 space-y-3">
              {(quiz.questions ?? []).map((q, i) => (
                <motion.li
                  key={q.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl bg-muted/40 p-4"
                >
                  {editingQuestionId === q.id ? (
                    <form onSubmit={handleSaveQuestion} className="space-y-4">
                      <p className="text-xs font-medium text-muted-foreground">Editing question {i + 1}</p>
                      <Input label="Question" value={editQuestionText} onChange={(e) => setEditQuestionText(e.target.value)} />
                      {editOptions.map((opt, j) => (
                        <Input
                          key={j}
                          label={`Option ${j + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const next = [...editOptions];
                            next[j] = e.target.value;
                            setEditOptions(next);
                          }}
                        />
                      ))}
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Correct answer</label>
                        <select
                          value={editCorrectAnswer}
                          onChange={(e) => setEditCorrectAnswer(e.target.value)}
                          className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm"
                        >
                          <option value="">Select correct option</option>
                          {editOptions.filter(Boolean).map((o) => (
                            <option key={o} value={o.trim()}>
                              {o.trim()}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Input label="Points" type="number" min="1" value={editPoints} onChange={(e) => setEditPoints(e.target.value)} />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={isSavingQuestion}>
                          Save changes
                        </Button>
                        <Button type="button" variant="secondary" size="sm" onClick={cancelEditQuestion} disabled={isSavingQuestion}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Q{i + 1} · {q.points} pt</p>
                        <p className="font-medium">{q.question}</p>
                        <p className="mt-1 text-xs text-green-700 dark:text-gold-400">
                          Answer: {q.correctAnswer}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 text-xs">
                        <button type="button" onClick={() => startEditQuestion(q)} className="text-green-700 dark:text-green-400">
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteQuestion(q.id)}
                          className="text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </motion.li>
              ))}
            </ul>

            <form onSubmit={handleAddQuestion} className="mt-6 space-y-4 rounded-xl border border-dashed border-border p-4">
              <h3 className="text-sm font-semibold">Add MCQ question</h3>
              <Input label="Question" value={questionText} onChange={(e) => setQuestionText(e.target.value)} />
              {options.map((opt, i) => (
                <Input
                  key={i}
                  label={`Option ${i + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = e.target.value;
                    setOptions(next);
                  }}
                />
              ))}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Correct answer</label>
                <select
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  className="w-full rounded-xl border border-border px-3.5 py-2.5 text-sm"
                >
                  <option value="">Select correct option</option>
                  {options.filter(Boolean).map((o) => (
                    <option key={o} value={o.trim()}>
                      {o.trim()}
                    </option>
                  ))}
                </select>
              </div>
              <Input label="Points" type="number" min="1" value={points} onChange={(e) => setPoints(e.target.value)} />
              <Button type="submit" variant="secondary" size="sm">
                Add question
              </Button>
            </form>
          </section>

          {analytics && analytics.recentAttempts.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-serif text-lg font-bold">Recent attempts</h2>
              <ul className="mt-4 divide-y divide-border">
                {analytics.recentAttempts.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium">{a.studentName}</p>
                      <p className="text-muted-foreground">{a.studentEmail}</p>
                    </div>
                    <span className={a.passed ? "text-green-600" : "text-red-600"}>
                      {Math.round(a.score)}% {a.passed ? "✓" : "✗"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
