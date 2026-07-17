"use client";

import Link from "next/link";

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  message?: string;
  backHref?: string;
  backLabel?: string;
}

export function ErrorFallback({
  error,
  reset,
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  backHref,
  backLabel = "Go back",
}: ErrorFallbackProps) {
  return (
    <section className="min-h-screen pt-28 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-serif text-3xl mb-4">{title}</h2>
        <p className="text-muted-foreground mb-6 text-sm max-w-md mx-auto">
          {message}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background text-sm font-medium"
          >
            Try again
          </button>
          {backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border text-sm font-medium"
            >
              {backLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
