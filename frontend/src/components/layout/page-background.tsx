import { GradientBlob } from "@/components/brand/gradient-blob";

interface PageBackgroundProps {
  children: React.ReactNode;
  variant?: "default" | "auth" | "dashboard";
}

export function PageBackground({ children, variant = "default" }: PageBackgroundProps) {
  return (
    <div className="relative min-h-screen hero-background mesh-background">
      {variant === "default" && (
        <>
          <GradientBlob className="-top-24 left-1/4 h-96 w-96" variant="gold" />
          <GradientBlob className="top-1/3 -right-20 h-80 w-80" variant="green" />
        </>
      )}
      {variant === "auth" && (
        <GradientBlob className="top-20 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2" variant="mixed" />
      )}
      {variant === "dashboard" && (
        <GradientBlob className="-top-16 right-0 h-72 w-72" variant="green" />
      )}
      <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
    </div>
  );
}
