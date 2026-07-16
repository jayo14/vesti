"use client";

export default function MarketplaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="min-h-screen pt-28 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-serif text-3xl mb-4">Something went wrong</h2>
        <p className="text-muted-foreground mb-6 text-sm max-w-md mx-auto">
          We couldn&apos;t load the marketplace. Please try again.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background text-sm font-medium"
        >
          Try again
        </button>
      </div>
    </section>
  );
}
