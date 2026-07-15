const materials = ["Cotton", "Silk", "Denim", "Leather", "Linen", "Wool"];

export default function MaterialPicker() {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-neutral-700">Material</h3>
      <div className="flex flex-wrap gap-2">
        {materials.map((m) => (
          <button
            key={m}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 transition hover:border-brand-300 hover:text-brand-700"
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}
