export default function MarketplaceLoading() {
  return (
    <section className="min-h-screen pt-28 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-8 w-48 bg-muted rounded-full animate-pulse mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
              <div className="h-4 w-3/4 bg-muted rounded-full animate-pulse" />
              <div className="h-3 w-1/2 bg-muted rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
