import Image from "next/image";
import { brand } from "@/lib/design-tokens";

interface AuthFormCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthFormCard({ title, subtitle, children, footer }: AuthFormCardProps) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="gradient-border overflow-hidden rounded-2xl shadow-xl shadow-green-900/5 dark:shadow-black/30">
        <div className="bg-card p-8 sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <Image
              src={brand.logo}
              alt={brand.name}
              width={140}
              height={48}
              className="mb-6 h-12 w-auto object-contain"
            />
            <h1 className="font-serif text-2xl font-bold text-foreground">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
          {footer ? (
            <div className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
