"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AuthNavbar } from "@/components/layout/auth-navbar";
import { PageBackground } from "@/components/layout/page-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brand } from "@/lib/design-tokens";

export default function VerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed) router.push(`/verify/${encodeURIComponent(trimmed)}`);
  }

  return (
    <PageBackground>
      <AuthNavbar />
      <main className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-8 shadow-lg"
        >
          <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-green-700 dark:text-green-400">
            {brand.name}
          </p>
          <h1 className="mt-2 text-center font-serif text-2xl font-bold">Verify Certificate</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Enter the verification code printed on the certificate to confirm its authenticity.
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Input
              label="Verification code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. CX-ABC123"
              required
            />
            <Button type="submit" variant="gold" className="w-full">
              Verify
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link href="/courses" className="text-green-700 hover:underline dark:text-green-400">
              Browse {brand.name} courses
            </Link>
          </p>
        </motion.div>
      </main>
    </PageBackground>
  );
}
