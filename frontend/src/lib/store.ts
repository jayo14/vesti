import type { Product } from "./types";

let products: Product[] = [
  { id: 1, name: "Urban Jacket", price: "$89", rating: 4, tag: "New" },
  { id: 2, name: "Linen Shirt", price: "$49", rating: 5, tag: "Sale" },
  { id: 3, name: "Slim Trousers", price: "$65", rating: 3, tag: "Popular" },
];

export function getProducts() {
  return products;
}
