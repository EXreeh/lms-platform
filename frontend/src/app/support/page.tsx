import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { PageBackground } from "@/components/layout/page-background";
import { SiteFooter } from "@/components/layout/site-footer";
import { layout } from "@/lib/layout";
import { brand } from "@/lib/design-tokens";
import { siteConfig } from "@/lib/site-config";

export default function SupportPage() {
  return (
    <PageBackground>
      <Navbar />
      <main className={`${layout.medium} flex-1 py-16`}>
        <h1 className="font-serif text-3xl font-bold">Help & Support</h1>
        <p className="mt-3 text-muted-foreground">
          Get help with your {brand.name} account, courses, and technical issues.
        </p>
        <ul className="mt-8 space-y-4 text-sm">
          <li className="rounded-xl border border-border bg-card p-4">
            <p className="font-semibold">Technical support</p>
            <a href={`mailto:${siteConfig.supportEmail}`} className="text-green-700 dark:text-green-400">
              {siteConfig.supportEmail}
            </a>
          </li>
          <li className="rounded-xl border border-border bg-card p-4">
            <p className="font-semibold">General inquiries</p>
            <a href={`mailto:${siteConfig.officialEmail}`} className="text-green-700 dark:text-green-400">
              {siteConfig.officialEmail}
            </a>
          </li>
          <li className="rounded-xl border border-border bg-card p-4">
            <p className="font-semibold">Sales</p>
            <a href={`tel:${siteConfig.salesPhone.replace(/\s/g, "")}`}>{siteConfig.salesPhone}</a>
          </li>
        </ul>
        <Link href="/courses" className="mt-8 inline-block text-sm text-green-700 dark:text-green-400">
          Browse courses →
        </Link>
      </main>
      <SiteFooter />
    </PageBackground>
  );
}
