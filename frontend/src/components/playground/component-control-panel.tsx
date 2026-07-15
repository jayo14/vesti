const controls = [
  { label: "Colour", options: ["Red", "Blue", "Black", "White"] },
  { label: "Fabric", options: ["Cotton", "Silk", "Denim", "Linen"] },
  { label: "Fit", options: ["Slim", "Regular", "Oversized"] },
];

export default function ComponentControlPanel() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-neutral-700">Adjustments</h3>
      {controls.map((c) => (
        <div key={c.label}>
          <p className="mb-1.5 text-xs font-medium text-neutral-500">{c.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {c.options.map((opt) => (
              <button
                key={opt}
                className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs text-neutral-600 transition hover:border-brand-300 hover:text-brand-700"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
