"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { PageBackground } from "@/components/layout/page-background";
import { PageTransition } from "@/components/motion/page-transition";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

export default function RegisterPage() {
  return (
    <PageBackground variant="auth">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <PageTransition>
          <AuthFormCard
            title="Institute portal access"
            subtitle="Private institute accounts only"
            footer={
              <>
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-green-700 hover:text-green-600 dark:text-gold-400"
                >
                  Sign in
                </Link>
              </>
            }
          >
            <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
              <p>
                Account creation is managed by {siteConfig.brandName} administration. Please
                contact your institute admin to receive student or teacher login credentials.
              </p>
              <p>
                If you already have an account, sign in below. Use forgot password if you need
                to reset your password.
              </p>
              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <Link href="/login" className="flex-1">
                  <Button variant="gold" className="w-full">
                    Sign in
                  </Button>
                </Link>
                <Link href="/forgot-password" className="flex-1">
                  <Button variant="secondary" className="w-full">
                    Forgot password
                  </Button>
                </Link>
              </div>
              <p className="text-xs">
                Need help?{" "}
                <a
                  href={`mailto:${siteConfig.supportEmail}`}
                  className="font-medium text-green-700 dark:text-gold-400"
                >
                  Contact support
                </a>
              </p>
            </div>
          </AuthFormCard>
        </PageTransition>
      </div>
    </PageBackground>
  );
}
