"use client";

import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface AvailabilityBadgeProps {
  product: Product;
  className?: string;
  variant?: "solid" | "subtle";
}

const LABELS: Record<Product["availability"], { text: string; cls: string }> = {
  "in-stock": {
    text: "In stock",
    cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  "low-stock": {
    text: "Low stock",
    cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  preorder: {
    text: "Preorder",
    cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  "sold-out": {
    text: "Sold out",
    cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
};

export function AvailabilityBadge({
  product,
  className,
  variant = "subtle",
}: AvailabilityBadgeProps) {
  const { text, cls } = LABELS[product.availability];
  const onlyLeft =
    product.availability === "low-stock" && product.stockCount > 0
      ? `Only ${product.stockCount} left`
      : null;

  if (variant === "solid") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium",
          cls,
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {onlyLeft || text}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
        cls,
        className
      )}
    >
      <span className="w-1 h-1 rounded-full bg-current" />
      {onlyLeft || text}
    </span>
  );
}

interface PriceTagProps {
  price: number;
  originalPrice?: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceTag({
  price,
  originalPrice,
  currency = "USD",
  size = "md",
  className,
}: PriceTagProps) {
  const sizeClass = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
  }[size];

  const hasDiscount = originalPrice && originalPrice > price;
  const discountPct = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div className={cn("flex items-baseline gap-2 flex-wrap", className)}>
      <span className={cn("font-serif font-medium", sizeClass)}>
        ${price.toLocaleString()}
      </span>
      {hasDiscount && (
        <>
          <span className="text-sm text-muted-foreground line-through">
            ${originalPrice!.toLocaleString()}
          </span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
            -{discountPct}%
          </span>
        </>
      )}
    </div>
  );
}
