import { brand } from "@/lib/design-tokens";

/**
 * Site-wide contact & legal placeholders — replace with production values.
 */
export const siteConfig = {
  brandName: brand.name,
  tagline: brand.tagline,
  /** Official / general inquiries */
  officialEmail: "info@cognitiax.ai",
  /** Technical support (help desk, bugs, account issues) */
  supportEmail: "support@cognitiax.ai",
  /** Sales inquiries */
  salesEmail: "sales@cognitiax.ai",
  /** Sales / support phone */
  salesPhone: "+91-XXXXXXXXXX",
  /** Registered office address */
  officeAddress: "Coming soon",
  social: {
    linkedin: "https://linkedin.com/company/cognitiax-ai",
    twitter: "https://twitter.com/cognitiaxai",
    youtube: "https://youtube.com/@cognitiaxai",
    github: "https://github.com/cognitiax-ai",
  },
  legal: {
    privacyPolicy: "/legal/privacy",
    termsOfService: "/legal/terms",
  },
} as const;

export const footerLinks = {
  quick: [
    { label: "Home", href: "/" },
    { label: "Courses", href: "/courses" },
    { label: "Sign in", href: "/login" },
    { label: "Register", href: "/register" },
  ],
  courses: [
    { label: "Browse catalog", href: "/courses" },
    { label: "Student dashboard", href: "/dashboard/student" },
    { label: "Teacher studio", href: "/dashboard/teacher" },
    { label: "Verify certificate", href: "/verify" },
  ],
  support: [
    { label: "Help center", href: "/support" },
    { label: "Contact support", href: `mailto:${siteConfig.supportEmail}` },
    { label: "Setup guide", href: "/support" },
  ],
  legal: [
            {label: "Privacy Policy", href: siteConfig.legal.privacyPolicy },
    { label: "Terms & Conditions", href: siteConfig.legal.termsOfService },
  ],
} as const;
