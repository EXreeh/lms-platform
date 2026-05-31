"use client";

import { motion } from "framer-motion";
import type { Certificate } from "@/types/certificate";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/design-tokens";

interface CertificateDisplayProps {
  certificate: Certificate;
  onDownload?: () => void;
  isDownloading?: boolean;
}

export function CertificateDisplay({ certificate, onDownload, isDownloading }: CertificateDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-2xl border-2 border-green-700/30 bg-gradient-to-br from-white via-green-50/50 to-amber-50/30 p-8 shadow-xl dark:from-card dark:via-green-950/20 dark:to-amber-950/10"
    >
      <div className="pointer-events-none absolute inset-4 rounded-xl border border-gold-500/20" />
      <div className="relative text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-700 dark:text-green-400">
          {brand.name}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Certificate of Completion</p>
        <h2 className="mt-6 font-serif text-2xl font-bold text-foreground md:text-3xl">
          {certificate.student.name}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">has successfully completed</p>
        <p className="mt-3 font-serif text-xl font-bold text-green-800 dark:text-green-300">
          {certificate.course.title}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {certificate.course.category} · {certificate.course.level}
        </p>
        <p className="mt-6 text-xs text-muted-foreground">
          Issued {new Date(certificate.issuedAt).toLocaleDateString()}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          <span>No. {certificate.certificateNumber}</span>
          <span>Verify: {certificate.verificationCode}</span>
        </div>
        {onDownload && (
          <Button
            variant="gold"
            className="mt-8"
            onClick={onDownload}
            disabled={isDownloading}
          >
            {isDownloading ? "Preparing PDF…" : "Download PDF"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
