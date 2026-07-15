import Link from "next/link";
import SmartSearchBar from "@/components/shopping/smart-search-bar";
import ProductCard from "@/components/shopping/product-card";
import AiStylingSuggestions from "@/components/shopping/ai-styling-suggestions";

const products = [
  { id: 1, name: "Urban Jacket", price: "$89", tag: "New", rating: 4 },
  { id: 2, name: "Linen Shirt", price: "$49", tag: "Sale", rating: 5 },
  { id: 3, name: "Slim Trousers", price: "$65", tag: "Popular", rating: 3 },
  { id: 4, name: "Canvas Sneakers", price: "$72", tag: "New", rating: 4 },
  { id: 5, name: "Wool Scarf", price: "$38", tag: "Sale", rating: 5 },
  { id: 6, name: "Leather Belt", price: "$44", rating: 4 },
];

export default function MarketplaceSection() {
  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-8">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
                Marketplace
              </h1>
              <p className="mt-2 text-neutral-600">Fresh drops from independent brands.</p>
            </div>
            <Link
              href="/marketplace"
              className="hidden text-sm font-medium text-brand-600 hover:underline sm:block"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="mt-6">
            <SmartSearchBar />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <div className="mt-8 text-center sm:hidden">
              <Link
                href="/marketplace"
                className="text-sm font-medium text-brand-600 hover:underline"
              >
                View all &rarr;
              </Link>
            </div>
          </div>
          <div className="hidden sm:block">
            <AiStylingSuggestions />
          </div>
        </div>
      </div>
    </section>
  );
}
