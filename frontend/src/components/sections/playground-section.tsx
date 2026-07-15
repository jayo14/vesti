import Link from "next/link";

export default function PlaygroundSection() {
  return (
    <section className="bg-neutral-50 py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
              AI Playground
            </h2>
            <p className="mt-2 text-neutral-600">
              Design, edit, and visualise garments with generative AI.
            </p>
          </div>
          <Link
            href="/playground"
            className="hidden text-sm font-medium text-brand-600 hover:underline sm:block"
          >
            Open Playground &rarr;
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
            </div>
            <h3 className="font-medium text-neutral-900">Prompt to Garment</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Describe your dream piece and watch AI bring it to life.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
              </svg>
            </div>
            <h3 className="font-medium text-neutral-900">Virtual Try-On</h3>
            <p className="mt-1 text-sm text-neutral-500">
              See how garments look on your own photos.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
              </svg>
            </div>
            <h3 className="font-medium text-neutral-900">AI Editing</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Modify colours, fabrics, and silhouettes in real time.
            </p>
          </div>
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/playground"
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Open Playground &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
