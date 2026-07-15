import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-brand-50 via-white to-brand-50">
      <div className="mx-auto max-w-5xl px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
          Fashion,
          <span className="text-brand-600"> your way</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600">
          Discover, design, and wear what you love. VESTI brings AI-powered fashion
          to your fingertips — from smart fit recommendations to virtual try-ons.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/marketplace"
            className="rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700"
          >
            Explore Marketplace
          </Link>
          <Link
            href="/playground"
            className="rounded-lg border border-neutral-300 px-6 py-3 font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            Try AI Studio
          </Link>
        </div>
      </div>
    </section>
  );
}
