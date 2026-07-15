const outfits = [
  { name: "Casual Day", items: ["White Tee", "Black Jeans", "Sneakers"] },
  { name: "Evening Out", items: ["Silk Blouse", "Leather Skirt", "Heels"] },
  { name: "Weekend", items: ["Denim Jacket", "Linen Pants", "Loafers"] },
];

export default function OutfitRecommender() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-neutral-700">AI Outfit Picks</h3>
      {outfits.map((o, i) => (
        <div
          key={i}
          className="cursor-pointer rounded-xl border border-neutral-200 bg-white p-4 transition hover:shadow-sm"
        >
          <h4 className="text-sm font-semibold text-neutral-900">{o.name}</h4>
          <p className="mt-1 text-xs text-neutral-500">{o.items.join(" / ")}</p>
        </div>
      ))}
    </div>
  );
}
