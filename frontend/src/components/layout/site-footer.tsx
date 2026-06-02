import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { brand } from "@/lib/design-tokens";
import { footerLinks, siteConfig } from "@/lib/site-config";
import { layout } from "@/lib/layout";

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-serif text-sm font-bold uppercase tracking-wide text-foreground">{title}</h3>
      <div className="mt-4 space-y-2 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  const external = href.startsWith("http") || href.startsWith("mailto:");
  if (external) {
    return (
      <a href={href} className="block transition-colors hover:text-foreground" target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined}>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className="block transition-colors hover:text-foreground">
      {label}
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card/50">
      <div className={`${layout.dashboard} py-14`}>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Logo size="sm" />
            <h3 className="mt-4 font-serif text-sm font-bold uppercase tracking-wide text-foreground">
              About CognitiaX AI
            </h3>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">{siteConfig.brandName}</strong> delivers
              AI-powered learning for students, educators, and institutions — with courses, progress
              tracking, quizzes, resources, and certificates in one secure platform.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">{siteConfig.tagline}</p>
          </div>

          <FooterColumn title="Quick links">
            {footerLinks.quick.map((link) => (
              <FooterLink key={link.href} {...link} />
            ))}
          </FooterColumn>

          <FooterColumn title="Courses">
            {footerLinks.courses.map((link) => (
              <FooterLink key={link.label} {...link} />
            ))}
          </FooterColumn>

          <FooterColumn title="Support">
            {footerLinks.support.map((link) => (
              <FooterLink key={link.label} {...link} />
            ))}
            <p className="pt-2">
              <span className="text-xs uppercase tracking-wide text-foreground/70">Technical support</span>
              <br />
              <a href={`mailto:${siteConfig.supportEmail}`} className="hover:text-foreground">
                {siteConfig.supportEmail}
              </a>
            </p>
          </FooterColumn>

          <FooterColumn title="Contact">
            <p>
              <span className="text-xs uppercase tracking-wide text-foreground/70">Official email</span>
              <br />
              <a href={`mailto:${siteConfig.officialEmail}`} className="hover:text-foreground">
                {siteConfig.officialEmail}
              </a>
            </p>
            <p>
              <span className="text-xs uppercase tracking-wide text-foreground/70">Technical support</span>
              <br />
              <a href={`mailto:${siteConfig.supportEmail}`} className="hover:text-foreground">
                {siteConfig.supportEmail}
              </a>
            </p>
            <p>
              <span className="text-xs uppercase tracking-wide text-foreground/70">Sales</span>
              <br />
              <a href={`mailto:${siteConfig.salesEmail}`} className="hover:text-foreground">
                {siteConfig.salesEmail}
              </a>
            </p>
            <p>
              <span className="text-xs uppercase tracking-wide text-foreground/70">Phone</span>
              <br />
              <a href={`tel:${siteConfig.salesPhone.replace(/\s/g, "")}`} className="hover:text-foreground">
                {siteConfig.salesPhone}
              </a>
            </p>
            <p>
              <span className="text-xs uppercase tracking-wide text-foreground/70">Address</span>
              <br />
              {siteConfig.officeAddress}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href={siteConfig.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs hover:text-foreground" aria-label="LinkedIn">
                LinkedIn
              </a>
              <a href={siteConfig.social.twitter} target="_blank" rel="noopener noreferrer" className="text-xs hover:text-foreground" aria-label="Twitter">
                Twitter
              </a>
              <a href={siteConfig.social.youtube} target="_blank" rel="noopener noreferrer" className="text-xs hover:text-foreground" aria-label="YouTube">
                YouTube
              </a>
              <a href={siteConfig.social.github} target="_blank" rel="noopener noreferrer" className="text-xs hover:text-foreground" aria-label="GitHub">
                GitHub
              </a>
            </div>
          </FooterColumn>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {footerLinks.legal.map((link) => (
              <FooterLink key={link.href} {...link} />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
