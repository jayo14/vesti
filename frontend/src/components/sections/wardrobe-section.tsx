import Link from "next/link";

export default function WardrobeSection() {
  return (
    <section className="bg-neutral-50 py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
              Your Wardrobe
            </h2>
            <p className="mt-2 text-neutral-600">
              Upload, organise, and let AI style you.
            </p>
          </div>
          <Link
            href="/wardrobe"
            className="hidden text-sm font-medium text-brand-600 hover:underline sm:block"
          >
            Open Wardrobe &rarr;
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </div>
            <h3 className="font-medium text-neutral-900">Upload Items</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Snap photos of your clothes and add them to your digital wardrobe.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 0 2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128m0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
              </svg>
            </div>
            <h3 className="font-medium text-neutral-900">AI Styling</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Get outfit recommendations based on your existing pieces.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </div>
            <h3 className="font-medium text-neutral-900">Mix & Match</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Preview outfit combos before stepping out the door.
            </p>
          </div>
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/wardrobe"
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Open Wardrobe &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
