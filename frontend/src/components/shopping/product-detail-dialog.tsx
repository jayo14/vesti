import AvailabilityBadge from "./availability-badge";
import StarRating from "./star-rating";

export default function ProductDetailDialog() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6">
      <div className="mb-4 aspect-[4/3] rounded-lg bg-neutral-100" />
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Product Name</h2>
            <p className="text-sm text-neutral-500">$99</p>
          </div>
          <AvailabilityBadge inStock />
        </div>
        <StarRating rating={4} />
        <p className="text-sm text-neutral-600">
          A beautifully crafted piece from our latest collection.
        </p>
        <button className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
          Add to Cart
        </button>
      </div>
    </div>
  );
}
