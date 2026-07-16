"use client";

import Link from "next/link";

export default function ProductDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="min-h-screen pt-28 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-serif text-3xl mb-4">Product not found</h2>
        <p className="text-muted-foreground mb-6 text-sm max-w-md mx-auto">
          This product may be unavailable or the link may be broken.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background text-sm font-medium"
          >
            Try again
          </button>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border text-sm font-medium"
          >
            Browse marketplace
          </Link>
        </div>
      </div>
    </section>
  );
}
