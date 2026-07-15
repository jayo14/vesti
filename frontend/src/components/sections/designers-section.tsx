import Link from "next/link";

const designers = [
  { name: "Amina K.", label: "Streetwear", color: "bg-pink-100" },
  { name: "Leo C.", label: "Minimalist", color: "bg-blue-100" },
  { name: "Zara M.", label: "Avant-garde", color: "bg-purple-100" },
  { name: "Rui T.", label: "Sustainable", color: "bg-green-100" },
];

export default function DesignersSection() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
              Independent Designers
            </h2>
            <p className="mt-2 text-neutral-600">
              Discover emerging talent and one-of-a-kind pieces.
            </p>
          </div>
          <Link
            href="/designers"
            className="hidden text-sm font-medium text-brand-600 hover:underline sm:block"
          >
            Meet the designers &rarr;
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {designers.map((d) => (
            <div
              key={d.name}
              className="group cursor-pointer rounded-xl border border-neutral-200 p-5 text-center transition hover:shadow-md"
            >
              <div
                className={`mx-auto mb-3 h-20 w-20 rounded-full ${d.color} flex items-center justify-center text-lg font-bold text-neutral-700`}
              >
                {d.name.charAt(0)}
              </div>
              <h3 className="font-medium text-neutral-900">{d.name}</h3>
              <p className="text-sm text-neutral-500">{d.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/designers"
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Meet the designers &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
