"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product, CheckoutItem } from "@/lib/types";
import { useStudioStore } from "@/lib/store";
import { useShoppingStore } from "@/lib/shopping-store";
import { toast } from "sonner";

interface Options {
  selectedSize: string;
  selectedColor: number;
  qty: number;
}

/**
 * Shared add-to-cart / buy-now / try-on logic used by both the product
 * detail dialog and the dedicated product page.
 */
export function useProductActions() {
  const router = useRouter();
  const { setSelectedGarment, setCustomGarmentImage, setGarmentSource, setSelectedMaterial } =
    useStudioStore();
  const { addToCart } = useShoppingStore();
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);

  const requireSize = (product: Product, opts: Options) => {
    if (!opts.selectedSize) {
      toast.error("Please select a size.");
      return false;
    }
    return true;
  };

  const addToCartItem = (product: Product, opts: Options) => {
    if (!requireSize(product, opts)) return;
    addToCart({
      productId: product.id,
      name: product.name,
      image: product.images[0]?.url || product.image,
      size: opts.selectedSize,
      color: product.colors[opts.selectedColor]?.name || "",
      price: product.price,
      quantity: opts.qty,
      sellerName: product.sellerName,
      sellerId: product.sellerId,
    });
    toast.success(`Added ${product.name} to bag.`);
  };

  const buyNow = (product: Product, opts: Options) => {
    if (!requireSize(product, opts)) return;
    setCheckoutItem({
      productId: product.id,
      name: product.name,
      image: product.images[0]?.url || product.image,
      size: opts.selectedSize,
      color: product.colors[opts.selectedColor]?.name || "",
      price: product.price,
      quantity: opts.qty,
      sellerName: product.sellerName,
      sellerId: product.sellerId,
    });
  };

  const tryOn = (product: Product) => {
    setSelectedGarment({
      id: product.id,
      name: product.name,
      designer: product.sellerName,
      designerId: product.sellerId,
      category: product.category,
      price: product.price,
      currency: product.currency,
      image: product.images[0]?.url || product.image,
      description: product.description,
      colors: product.colors.map((c) => c.name),
      sizes: product.sizes.map((s) => s.label),
      tags: product.tags,
      featured: product.featured,
      inStock: product.availability !== "sold-out",
      material: product.material,
    });
    setCustomGarmentImage(null);
    setGarmentSource("marketplace");
    if (product.material)     setSelectedMaterial(product.material);
    router.push("/try-on");
    toast.success(`${product.name} loaded into the Studio.`);
  };

  return { checkoutItem, addToCartItem, buyNow, tryOn };
}
