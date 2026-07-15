import StarRating from "./star-rating";

type Product = {
  id: number;
  name: string;
  price: string;
  rating?: number;
  tag?: string;
};

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group cursor-pointer rounded-xl border border-neutral-200 bg-white p-4 transition hover:shadow-md">
      <div className="mb-3 aspect-[4/3] rounded-lg bg-neutral-100" />
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-neutral-900">{product.name}</h3>
          <p className="text-sm text-neutral-500">{product.price}</p>
          {product.rating && <StarRating rating={product.rating} />}
        </div>
        {product.tag && (
          <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
            {product.tag}
          </span>
        )}
      </div>
    </div>
  );
}
