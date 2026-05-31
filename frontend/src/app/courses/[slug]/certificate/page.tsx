"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AuthNavbar } from "@/components/layout/auth-navbar";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageBackground } from "@/components/layout/page-background";
import { CertificateDisplay } from "@/components/certificates/certificate-display";
import { ProgressBar } from "@/components/learning/progress-bar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { fetchCourseProgress } from "@/lib/learning-api";
import {
  checkCertificateEligibility,
  fetchCertificateByCourse,
  generateCertificate,
  downloadCertificate,
} from "@/lib/certificates-api";
import { formatApiError } from "@/lib/format-api-error";
import type { Certificate, CertificateEligibility } from "@/types/certificate";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";

export default function CourseCertificatePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [courseTitle, setCourseTitle] = useState("");
  const [courseId, setCourseId] = useState<string | null>(null);
  const [progressPct, setProgressPct] = useState(0);
  const [eligibility, setEligibility] = useState<CertificateEligibility | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const progressRes = await fetchCourseProgress(slug);
      const { course, enrollment } = progressRes.data;
      setCourseTitle(course.title);
      setCourseId(course.id);
      setProgressPct(enrollment?.progressPercentage ?? 0);

      const [eligRes, certRes] = await Promise.all([
        checkCertificateEligibility(course.id),
        fetchCertificateByCourse(course.id),
      ]);
      setEligibility(eligRes.data);
      setCertificate(certRes.data.certificate);
    } catch (err) {
      toastError(formatApiError(err, "Failed to load certificate data"));
    } finally {
      setIsLoading(false);
    }
  }, [slug, toastError]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace(`/login?redirect=/courses/${slug}/certificate`);
      return;
    }
    void load();
  }, [authLoading, isAuthenticated, load, router, slug]);

  async function handleGenerate() {
    if (!courseId) return;
    setIsGenerating(true);
    try {
      const res = await generateCertificate(courseId);
      setCertificate(res.data.certificate);
      toastSuccess("Certificate issued!");
      await load();
    } catch (err) {
      toastError(formatApiError(err, "Could not generate certificate"));
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDownload() {
    if (!certificate) return;
    setIsDownloading(true);
    try {
      await downloadCertificate(
        certificate.id,
        `cognitiax-certificate-${certificate.certificateNumber}.pdf`,
      );
      toastSuccess("Certificate downloaded");
    } catch (err) {
      toastError(formatApiError(err, "Download failed"));
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <PageBackground>
      <AuthNavbar />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "Courses", href: "/courses" },
            { label: courseTitle || "Course", href: `/courses/${slug}` },
            { label: "Certificate" },
          ]}
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <h1 className="font-serif text-3xl font-bold">Course Certificate</h1>
          <p className="mt-2 text-muted-foreground">
            Earn your CognitiaX AI certificate by completing all lessons and passing required quizzes.
          </p>

          {isLoading ? (
            <div className="mt-16 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : certificate ? (
            <div className="mt-10 space-y-6">
              <CertificateDisplay
                certificate={certificate}
                onDownload={handleDownload}
                isDownloading={isDownloading}
              />
              <div className="flex flex-wrap gap-3">
                <Link href={`/courses/${slug}/learn`}>
                  <Button variant="secondary">Back to learning</Button>
                </Link>
                <Link href={`/verify/${certificate.verificationCode}`}>
                  <Button variant="ghost">Verify this certificate</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-10 space-y-8">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-serif text-lg font-bold">Your progress</h2>
                <div className="mt-4 max-w-md">
                  <ProgressBar value={progressPct} label={`${progressPct}% course complete`} />
                </div>
                {eligibility && (
                  <ul className="mt-6 space-y-2 text-sm">
                    <li className={eligibility.lessonsComplete ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}>
                      {eligibility.lessonsComplete ? "✓" : "○"} Lessons: {eligibility.completedLessons} / {eligibility.totalLessons} complete
                    </li>
                    <li className={eligibility.quizzesPassed ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}>
                      {eligibility.quizzesPassed ? "✓" : "○"} Quizzes: {eligibility.passedQuizzes} / {eligibility.totalQuizzes} passed
                    </li>
                  </ul>
                )}
              </div>

              {eligibility?.eligible ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl border border-green-700/30 bg-green-50/50 p-8 text-center dark:bg-green-950/20"
                >
                  <p className="text-4xl">🏆</p>
                  <h2 className="mt-4 font-serif text-xl font-bold">You&apos;re eligible!</h2>
                  <p className="mt-2 text-muted-foreground">
                    Generate your official CognitiaX AI certificate of completion.
                  </p>
                  <Button
                    variant="gold"
                    className="mt-6"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? "Generating…" : "Generate certificate"}
                  </Button>
                </motion.div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                  <p className="text-4xl">📜</p>
                  <h2 className="mt-4 font-serif text-xl font-bold">Certificate not yet available</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {eligibility?.reasons?.join(" ") ??
                      "Complete all lessons and pass required quizzes to unlock your certificate."}
                  </p>
                  <Link href={`/courses/${slug}/learn`} className="mt-6 inline-block">
                    <Button variant="gold">Continue learning</Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>
    </PageBackground>
  );
}
