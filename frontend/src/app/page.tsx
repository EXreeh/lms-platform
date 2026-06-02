import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/navbar";
import { PageBackground } from "@/components/layout/page-background";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { layout } from "@/lib/layout";
import { brand } from "@/lib/design-tokens";

const features = [
  {
    title: "AI-Powered Learning",
    description:
      "Personalized paths and intelligent recommendations adapt to each learner's pace and goals.",
    icon: "✦",
  },
  {
    title: "Student Portal",
    description:
      "Access courses, track progress, and complete interactive lessons from any device.",
    icon: "◈",
  },
  {
    title: "Teacher Studio",
    description:
      "Create courses, upload content, and monitor engagement with powerful analytics.",
    icon: "◇",
  },
  {
    title: "Enterprise Admin",
    description:
      "Manage users, roles, and institutional settings from a centralized command center.",
    icon: "◎",
  },
];

const stats = [
  { value: "10k+", label: "Active learners" },
  { value: "500+", label: "Expert instructors" },
  { value: "99.9%", label: "Platform uptime" },
];

export default function LandingPage() {
  return (
    <PageBackground variant="default">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className={`${layout.page} pb-20 pt-16 lg:pt-24`}>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-700/20 bg-green-50 px-4 py-1.5 text-sm font-medium text-green-800 dark:border-green-600/30 dark:bg-green-950/50 dark:text-green-300">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-500" aria-hidden />
                AI-powered EdTech platform
              </p>
              <h1 className="font-serif text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
                Learn smarter with{" "}
                <span className="gradient-text-brand">{brand.name}</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                {brand.tagline}. A premium learning experience built for students, educators,
                and institutions — secure, scalable, and ready for the future of education.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/register">
                  <Button size="lg" variant="gold">
                    Start learning free
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="secondary" size="lg">
                    Sign in
                  </Button>
                </Link>
              </div>
              <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-border pt-10">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <dt className="text-2xl font-bold text-foreground">{stat.value}</dt>
                    <dd className="mt-1 text-sm text-muted-foreground">{stat.label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="relative rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-green-900/10 dark:shadow-black/40">
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  width={400}
                  height={400}
                  className="mx-auto h-auto w-full max-w-[22rem] object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-y border-border bg-card/50 py-20 backdrop-blur-sm">
          <div className={layout.page}>
            <div className="max-w-2xl">
              <h2 className="font-serif text-3xl font-bold text-foreground">
                Built for every role
              </h2>
              <p className="mt-3 text-muted-foreground">
                From individual learners to enterprise teams — one platform, infinite possibilities.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title} className="group transition-all hover:shadow-lg hover:shadow-green-900/5">
                  <span
                    className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl gradient-gold text-sm font-bold text-green-950"
                    aria-hidden
                  >
                    {feature.icon}
                  </span>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={`${layout.page} py-20`}>
          <div className="relative overflow-hidden rounded-3xl gradient-brand px-8 py-14 text-center sm:px-16">
            <div className="absolute inset-0 bg-[url('/brand/cognitiax-logo.png')] bg-center bg-no-repeat opacity-[0.04] bg-[length:40%]" aria-hidden />
            <h2 className="relative font-serif text-3xl font-bold text-white sm:text-4xl">
              Ready to transform learning?
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-green-50/90">
              Join {brand.name} — courses, video lessons, quizzes, and progress tracking
              coming in upcoming releases.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/register">
                <Button variant="gold" size="lg">
                  Create your account
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <SiteFooter />
      </main>
    </PageBackground>
  );
}
