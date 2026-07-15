export default function AvailabilityBadge({ inStock }: { inStock: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        inStock
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          inStock ? "bg-green-500" : "bg-red-500"
        }`}
      />
      {inStock ? "In Stock" : "Out of Stock"}
    </span>
  );
}
