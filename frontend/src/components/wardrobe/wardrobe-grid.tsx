const items = [
  { id: 1, name: "White Tee", category: "Tops" },
  { id: 2, name: "Denim Jacket", category: "Outerwear" },
  { id: 3, name: "Black Jeans", category: "Bottoms" },
  { id: 4, name: "Canvas Sneakers", category: "Footwear" },
  { id: 5, name: "Wool Scarf", category: "Accessories" },
  { id: 6, name: "Leather Belt", category: "Accessories" },
];

export default function WardrobeGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="group cursor-pointer rounded-xl border border-neutral-200 bg-white p-3 transition hover:shadow-md"
        >
          <div className="mb-2 aspect-square rounded-lg bg-neutral-100" />
          <h3 className="text-sm font-medium text-neutral-900">{item.name}</h3>
          <p className="text-xs text-neutral-500">{item.category}</p>
        </div>
      ))}
    </div>
  );
}
