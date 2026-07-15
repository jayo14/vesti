import { products } from "./products";

let cart: number[] = [];

export function getCart() {
  return cart;
}

export function addToCart(id: number) {
  if (!cart.includes(id)) cart.push(id);
}

export function removeFromCart(id: number) {
  cart = cart.filter((i) => i !== id);
}

export function getCartProducts() {
  return products.filter((p) => cart.includes(p.id));
}
