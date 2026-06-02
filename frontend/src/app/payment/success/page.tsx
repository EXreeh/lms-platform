"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AuthNavbar } from "@/components/layout/auth-navbar";
import { PageBackground } from "@/components/layout/page-background";
import { Button } from "@/components/ui/button";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const courseSlug = searchParams.get("course");

  return (
    <main className="mx-auto max-w-lg px-4 py-20 sm:px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-green-700/30 bg-card p-10 text-center shadow-xl"
      >
        <p className="text-5xl">✓</p>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-green-700 dark:text-green-400">
          CognitiaX AI
        </p>
        <h1 className="mt-2 font-serif text-2xl font-bold">Payment successful</h1>
        <p className="mt-3 text-muted-foreground">
          Your enrollment is confirmed. You now have full access to the course.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {courseSlug ? (
            <Link href={`/courses/${courseSlug}/learn`}>
              <Button variant="gold" className="w-full sm:w-auto">
                Start learning
              </Button>
            </Link>
          ) : null}
          <Link href="/dashboard/student/payments">
            <Button variant="secondary" className="w-full sm:w-auto">
              View payment history
            </Button>
          </Link>
        </div>
      </motion.div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <PageBackground>
      <AuthNavbar />
      <Suspense
        fallback={
          <main className="mx-auto max-w-lg px-4 py-20 text-center text-muted-foreground sm:px-6">
            Loading…
          </main>
        }
      >
        <PaymentSuccessContent />
      </Suspense>
    </PageBackground>
  );
}
