"use client";

import { motion } from "framer-motion";
import { Sparkles, Shirt, Star, ArrowRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { StarRating } from "./star-rating";
import { AvailabilityBadge, PriceTag } from "./availability-badge";

interface ProductCardProps {
  product: Product;
  onOpen: (product: Product) => void;
  onTryOn: (product: Product) => void;
  index?: number;
}

export function ProductCard({
  product,
  onOpen,
  onTryOn,
  index = 0,
}: ProductCardProps) {
  const isSoldOut = product.availability === "sold-out";

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className="group cursor-pointer"
      onClick={() => onOpen(product)}
    >
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted mb-3">
        {/* Primary image */}
        <img
          src={product.images[0]?.url || product.image}
          alt={product.images[0]?.alt || product.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        {/* Hover image (if more than one) */}
        {product.images[1] && (
          <img
            src={product.images[1].url}
            alt={product.images[1].alt}
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            loading="lazy"
          />
        )}

        {/* Badges (top-left) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {product.featured && (
            <span className="px-2 py-0.5 rounded-full glass-strong text-[10px] font-medium inline-flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-champagne" />
              Featured
            </span>
          )}
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-medium">
              Sale
            </span>
          )}
        </div>

        {/* Availability badge (top-right) */}
        <div className="absolute top-3 right-3">
          <AvailabilityBadge product={product} />
        </div>

        {/* Sold-out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-foreground text-background text-xs font-medium">
              Sold out
            </span>
          </div>
        )}

        {/* Hover actions */}
        {!isSoldOut && (
          <div className="absolute inset-x-0 bottom-0 p-3 flex gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpen(product);
              }}
              className="flex-1 py-2 rounded-full glass-strong text-xs font-medium hover:bg-foreground hover:text-background transition-colors"
            >
              View Details
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTryOn(product);
              }}
              className="flex-1 py-2 rounded-full bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-1"
            >
              <Shirt className="w-3.5 h-3.5" />
              Try On
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span className="truncate">{product.sellerName}</span>
          <span className="text-champagne">✓</span>
        </div>
        <div className="text-sm font-medium leading-tight line-clamp-1">
          {product.name}
        </div>
        <div className="flex items-center justify-between pt-1">
          <PriceTag
            price={product.price}
            originalPrice={product.originalPrice}
            size="sm"
          />
          <StarRating
            rating={product.rating}
            size="xs"
            showNumber
            reviewCount={product.reviewCount}
          />
        </div>
      </div>
    </motion.article>
  );
}
