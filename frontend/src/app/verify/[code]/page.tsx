"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { AuthNavbar } from "@/components/layout/auth-navbar";
import { PageBackground } from "@/components/layout/page-background";
import { CertificateDisplay } from "@/components/certificates/certificate-display";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { verifyCertificate } from "@/lib/certificates-api";
import { formatApiError } from "@/lib/format-api-error";
import type { Certificate } from "@/types/certificate";

export default function VerifyCodePage() {
  const params = useParams();
  const code = decodeURIComponent(params.code as string);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await verifyCertificate(code);
        if (res.data.valid && res.data.certificate) {
          setCertificate(res.data.certificate);
        } else {
          setMessage(res.data.message ?? "This verification code is not valid.");
        }
      } catch (err) {
        setMessage(formatApiError(err, "Verification failed"));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [code]);

  return (
    <PageBackground>
      <AuthNavbar />
      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-green-700 dark:text-green-400">
            CognitiaX AI
          </p>
          <h1 className="mt-2 text-center font-serif text-2xl font-bold">Certificate Verification</h1>

          {isLoading ? (
            <div className="mt-16 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : certificate ? (
            <div className="mt-10 space-y-6">
              <div className="rounded-xl border border-green-700/30 bg-green-50/50 p-4 text-center text-sm text-green-800 dark:bg-green-950/20 dark:text-green-300">
                ✓ This certificate is authentic and was issued by CognitiaX AI.
              </div>
              <CertificateDisplay certificate={certificate} />
              <div className="text-center">
                <Link href="/verify">
                  <Button variant="secondary">Verify another</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="text-4xl">⚠️</p>
              <h2 className="mt-4 font-serif text-xl font-bold">Verification failed</h2>
              <p className="mt-2 text-muted-foreground">{message}</p>
              <Link href="/verify" className="mt-6 inline-block">
                <Button variant="gold">Try again</Button>
              </Link>
            </div>
          )}
        </motion.div>
      </main>
    </PageBackground>
  );
}
