export default function AiStylingSuggestions() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-neutral-700">AI Styling Tips</h3>
      <div className="space-y-2">
        {[
          "Pair with a white blouse for contrast.",
          "Add a leather belt to define the waist.",
          "Works well with neutral-toned accessories.",
        ].map((tip, i) => (
          <div
            key={i}
            className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-800"
          >
            {tip}
          </div>
        ))}
      </div>
    </div>
  );
}
