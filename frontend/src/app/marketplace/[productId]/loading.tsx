export default function ProductDetailLoading() {
  return (
    <section className="min-h-screen pt-28 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="aspect-[3/4] rounded-3xl bg-muted animate-pulse" />
          <div className="space-y-4">
            <div className="h-6 w-24 bg-muted rounded-full animate-pulse" />
            <div className="h-10 w-3/4 bg-muted rounded-full animate-pulse" />
            <div className="h-6 w-1/3 bg-muted rounded-full animate-pulse" />
            <div className="h-20 w-full bg-muted rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}
