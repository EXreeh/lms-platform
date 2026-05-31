"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { fetchMyCertificates, downloadCertificate } from "@/lib/certificates-api";
import { formatApiError } from "@/lib/format-api-error";
import type { Certificate } from "@/types/certificate";
import { useToast } from "@/context/toast-context";

export default function StudentCertificatesPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchMyCertificates();
      setCertificates(res.data?.certificates ?? []);
    } catch (err) {
      toastError(formatApiError(err, "Failed to load certificates"));
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDownload(cert: Certificate) {
    setDownloadingId(cert.id);
    try {
      await downloadCertificate(cert.id, `cognitiax-certificate-${cert.certificateNumber}.pdf`);
      toastSuccess("Certificate downloaded");
    } catch (err) {
      toastError(formatApiError(err, "Download failed"));
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <DashboardShell
      title="My Certificates"
      description="View and download certificates you've earned on CognitiaX AI."
      badge="Student Portal"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="STUDENT" />
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : certificates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-4xl">🏆</p>
              <h2 className="mt-4 font-serif text-xl font-bold">No certificates yet</h2>
              <p className="mt-2 text-muted-foreground">
                Complete a course with 100% lesson progress and pass all required quizzes to earn your first certificate.
              </p>
              <Link href="/courses" className="mt-6 inline-block">
                <Button variant="gold">Browse courses</Button>
              </Link>
            </div>
          ) : (
            <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {certificates.map((cert, i) => (
                <motion.li
                  key={cert.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5"
                >
                  <div>
                    <p className="font-serif text-lg font-bold">{cert.course.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Issued {new Date(cert.issuedAt).toLocaleDateString()} · No. {cert.certificateNumber}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Verify: {cert.verificationCode}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/courses/${cert.course.slug}/certificate`}>
                      <Button variant="secondary" size="sm">
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => handleDownload(cert)}
                      disabled={downloadingId === cert.id}
                    >
                      {downloadingId === cert.id ? "Downloading…" : "Download PDF"}
                    </Button>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
