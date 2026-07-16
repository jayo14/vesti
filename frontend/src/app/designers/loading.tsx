export default function DesignersLoading() {
  return (
    <section className="min-h-screen pt-28 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-10 w-64 bg-muted rounded-full animate-pulse mb-10" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[4/5] rounded-2xl bg-muted animate-pulse" />
              <div className="h-4 w-2/3 bg-muted rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
