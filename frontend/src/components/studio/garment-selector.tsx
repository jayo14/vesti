const garments = ["T-shirt", "Jacket", "Dress", "Pants", "Skirt", "Shirt"];

export default function GarmentSelector() {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-neutral-700">Garment Type</h3>
      <div className="flex flex-wrap gap-2">
        {garments.map((g) => (
          <button
            key={g}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 transition hover:border-brand-300 hover:text-brand-700"
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}
