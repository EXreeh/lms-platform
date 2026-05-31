"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { CertificateDisplay } from "@/components/certificates/certificate-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { fetchAdminCertificates, downloadAdminCertificate } from "@/lib/admin-api";
import { verifyCertificate } from "@/lib/certificates-api";
import { formatApiError } from "@/lib/format-api-error";
import type { Certificate } from "@/types/certificate";
import { useToast } from "@/context/toast-context";

export default function AdminCertificatesPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [verifyCode, setVerifyCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedCert, setVerifiedCert] = useState<Certificate | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAdminCertificates();
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

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = verifyCode.trim();
    if (!code) return;
    setIsVerifying(true);
    setVerifiedCert(null);
    setVerifyMessage(null);
    try {
      const res = await verifyCertificate(code);
      if (res.data.valid && res.data.certificate) {
        setVerifiedCert(res.data.certificate);
        toastSuccess("Certificate verified");
      } else {
        setVerifyMessage(res.data.message ?? "Invalid verification code");
      }
    } catch (err) {
      toastError(formatApiError(err, "Verification failed"));
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleDownload(cert: Certificate) {
    setDownloadingId(cert.id);
    try {
      await downloadAdminCertificate(cert.id, `cognitiax-certificate-${cert.certificateNumber}.pdf`);
      toastSuccess("Certificate downloaded");
    } catch (err) {
      toastError(formatApiError(err, "Download failed"));
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <DashboardShell
      title="Certificates"
      description="View issued certificates and verify credentials by code."
      badge="Administrator"
    >
      <div className="flex flex-col gap-8 lg:flex-row">
        <DashboardSidebar role="ADMIN" />
        <div className="min-w-0 flex-1 space-y-8">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-serif text-lg font-bold">Verify certificate</h2>
            <form onSubmit={handleVerify} className="mt-4 flex flex-wrap gap-3">
              <div className="min-w-[200px] flex-1">
                <Input
                  label="Verification code"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="Enter code from certificate"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" variant="gold" disabled={isVerifying}>
                  {isVerifying ? "Verifying…" : "Verify"}
                </Button>
              </div>
            </form>
            {verifyMessage && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">{verifyMessage}</p>
            )}
            {verifiedCert && (
              <div className="mt-6">
                <CertificateDisplay certificate={verifiedCert} />
              </div>
            )}
          </section>

          <section>
            <h2 className="font-serif text-lg font-bold">Issued certificates ({certificates.length})</h2>
            {isLoading ? (
              <div className="mt-8 flex justify-center">
                <Spinner size="lg" />
              </div>
            ) : certificates.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-border p-12 text-center">
                <p className="text-4xl">🏆</p>
                <p className="mt-4 text-muted-foreground">No certificates issued yet.</p>
              </div>
            ) : (
              <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-3">
                {certificates.map((cert, i) => (
                  <motion.li
                    key={cert.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
                  >
                    <div>
                      <p className="font-semibold">{cert.student.name}</p>
                      <p className="text-sm text-muted-foreground">{cert.course.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(cert.issuedAt).toLocaleDateString()} · {cert.certificateNumber} · {cert.verificationCode}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/verify/${cert.verificationCode}`}>
                        <Button variant="ghost" size="sm">
                          Public verify
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
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
