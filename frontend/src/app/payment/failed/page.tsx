"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AuthNavbar } from "@/components/layout/auth-navbar";
import { PageBackground } from "@/components/layout/page-background";
import { Button } from "@/components/ui/button";

export default function PaymentFailedPage() {
  const searchParams = useSearchParams();
  const courseSlug = searchParams.get("course");

  return (
    <PageBackground>
      <AuthNavbar />
      <main className="mx-auto max-w-lg px-4 py-20 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-red-200 bg-card p-10 text-center shadow-xl dark:border-red-900"
        >
          <p className="text-5xl">✕</p>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-green-700 dark:text-green-400">
            CognitiaX AI
          </p>
          <h1 className="mt-2 font-serif text-2xl font-bold">Payment failed</h1>
          <p className="mt-3 text-muted-foreground">
            Your payment could not be completed. No charges were applied. You can try again when ready.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {courseSlug ? (
              <Link href={`/courses/${courseSlug}`}>
                <Button variant="gold" className="w-full sm:w-auto">
                  Try again
                </Button>
              </Link>
            ) : null}
            <Link href="/courses">
              <Button variant="secondary" className="w-full sm:w-auto">
                Browse courses
              </Button>
            </Link>
          </div>
        </motion.div>
      </main>
    </PageBackground>
  );
}
