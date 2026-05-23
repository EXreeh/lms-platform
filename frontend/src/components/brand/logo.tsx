import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/design-tokens";

interface LogoProps {
  href?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { height: 36, width: 120 },
  md: { height: 44, width: 150 },
  lg: { height: 56, width: 190 },
};

export function Logo({ href = "/", size = "md", showText = false, className = "" }: LogoProps) {
  const dim = sizes[size];

  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src={brand.logo}
        alt={`${brand.name} logo`}
        width={dim.width}
        height={dim.height}
        className="object-contain"
        style={{ height: dim.height, width: "auto" }}
        priority
      />
      {showText ? (
        <span className="font-serif text-lg font-semibold tracking-wide text-foreground">
          {brand.name}
        </span>
      ) : null}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2">
        {content}
      </Link>
    );
  }

  return content;
}
