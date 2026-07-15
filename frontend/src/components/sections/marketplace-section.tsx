import Link from "next/link";

const products = [
  { id: 1, name: "Urban Jacket", price: "$89", tag: "New" },
  { id: 2, name: "Linen Shirt", price: "$49", tag: "Sale" },
  { id: 3, name: "Slim Trousers", price: "$65", tag: "Popular" },
  { id: 4, name: "Canvas Sneakers", price: "$72", tag: "New" },
  { id: 5, name: "Wool Scarf", price: "$38", tag: "Sale" },
  { id: 6, name: "Leather Belt", price: "$44", tag: null },
];

export default function MarketplaceSection() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
              Marketplace
            </h2>
            <p className="mt-2 text-neutral-600">Fresh drops from independent brands.</p>
          </div>
          <Link
            href="/marketplace"
            className="hidden text-sm font-medium text-brand-600 hover:underline sm:block"
          >
            View all &rarr;
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="group cursor-pointer rounded-xl border border-neutral-200 bg-white p-4 transition hover:shadow-md"
            >
              <div className="mb-3 aspect-[4/3] rounded-lg bg-neutral-100" />
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-neutral-900">{p.name}</h3>
                  <p className="text-sm text-neutral-500">{p.price}</p>
                </div>
                {p.tag && (
                  <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                    {p.tag}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/marketplace"
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            View all &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
