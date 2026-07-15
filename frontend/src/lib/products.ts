export const products = [
  { id: 1, name: "Urban Jacket", price: 89, rating: 4, tag: "New" },
  { id: 2, name: "Linen Shirt", price: 49, rating: 5, tag: "Sale" },
  { id: 3, name: "Slim Trousers", price: 65, rating: 3, tag: "Popular" },
  { id: 4, name: "Canvas Sneakers", price: 72, rating: 4, tag: "New" },
  { id: 5, name: "Wool Scarf", price: 38, rating: 5, tag: "Sale" },
  { id: 6, name: "Leather Belt", price: 44, rating: 4 },
];

export function getProduct(id: number) {
  return products.find((p) => p.id === id);
}
