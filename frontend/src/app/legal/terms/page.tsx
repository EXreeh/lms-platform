import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { PageBackground } from "@/components/layout/page-background";
import { SiteFooter } from "@/components/layout/site-footer";
import { layout } from "@/lib/layout";
import { brand } from "@/lib/design-tokens";
import { siteConfig } from "@/lib/site-config";

export default function TermsPage() {
  return (
    <PageBackground>
      <Navbar />
      <main className={`${layout.medium} flex-1 py-16`}>
        <h1 className="font-serif text-3xl font-bold">Terms & Conditions</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: placeholder — replace with your legal date</p>
        <div className="prose prose-sm mt-8 max-w-none text-muted-foreground dark:prose-invert">
          <p>
            This is a placeholder terms of service page for {brand.name}. Replace with your official terms covering
            account use, course enrollment, intellectual property, acceptable use, and limitation of liability.
          </p>
          <p>
            Questions? Contact{" "}
            <a href={`mailto:${siteConfig.officialEmail}`} className="text-green-700 dark:text-green-400">
              {siteConfig.officialEmail}
            </a>
            .
          </p>
        </div>
        <Link href="/" className="mt-8 inline-block text-sm text-green-700 dark:text-green-400">
          ← Back to home
        </Link>
      </main>
      <SiteFooter />
    </PageBackground>
  );
}
