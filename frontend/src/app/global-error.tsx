"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#051c17] px-4 text-center text-white">
        <div>
          <h1 className="text-2xl font-bold">CognitiaX AI</h1>
          <p className="mt-2 text-white/70">A critical error occurred.</p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-xl bg-[#C5A028] px-6 py-2.5 text-sm font-semibold text-[#051c17]"
          >
            Reload application
          </button>
        </div>
      </body>
    </html>
  );
}
