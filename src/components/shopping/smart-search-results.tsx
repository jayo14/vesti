"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  Tag,
  Calendar,
  Palette,
  User,
  Wallet,
  Check,
  ArrowRight,
  Shirt,
} from "lucide-react";
import { useShoppingStore } from "@/lib/shopping-store";
import { useStudioStore } from "@/lib/store";
import { getProductById } from "@/lib/products";
import type { SmartSearchFilters, Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { StarRating } from "./star-rating";
import { PriceTag } from "./availability-badge";

interface SmartSearchResultsProps {
  onOpenProduct: (p: Product) => void;
  onTryOn: (p: Product) => void;
}

export function SmartSearchResults({
  onOpenProduct,
  onTryOn,
}: SmartSearchResultsProps) {
  const {
    smartSearchResult,
    smartSearchLoading,
    smartSearchQuery,
    setSmartSearchResult,
    setSmartSearchActive,
  } = useShoppingStore();
  const { setSelectedGarment, setCustomGarmentImage, setGarmentSource, setSelectedMaterial, setView } = useStudioStore();

  if (smartSearchLoading) {
    return (
      <div className="space-y-4">
        <LoadingState query={smartSearchQuery} />
      </div>
    );
  }

  if (!smartSearchResult) return null;

  if (!smartSearchResult.success) {
    return (
      <div className="p-6 rounded-2xl bg-destructive/5 border border-destructive/20 text-sm flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-destructive">Search failed</p>
          <p className="text-muted-foreground mt-1">
            {smartSearchResult.error || "Please try again."}
          </p>
        </div>
      </div>
    );
  }

  const { interpretation, filters, matches, summary } = smartSearchResult;

  const handleClose = () => {
    setSmartSearchResult(null);
    setSmartSearchActive(false);
  };

  const handleProductOpen = (product: Product) => {
    onOpenProduct(product);
  };

  const handleProductTryOn = (product: Product) => {
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
    if (product.material) setSelectedMaterial(product.material);
    setView("studio");
    toast.success(`${product.name} loaded into the Studio.`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* AI summary header card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-champagne-muted/40 to-transparent border border-champagne/30">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-background" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider font-medium text-champagne">
                AI Smart Search
              </span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[10px] text-muted-foreground italic line-clamp-1">
                "{smartSearchQuery}"
              </span>
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              {summary}
            </p>
            {interpretation && (
              <p className="text-[11px] text-muted-foreground mt-1.5 italic">
                Understanding: {interpretation}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-full hover:bg-foreground/5 flex items-center justify-center flex-shrink-0"
            aria-label="Close search results"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Parsed filters */}
        {filters && <ParsedFilters filters={filters} />}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {matches && matches.length > 0
            ? `${matches.length} match${matches.length !== 1 ? "es" : ""} found`
            : "No matches found"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-champagne" />
          Ranked by AI relevance
        </span>
      </div>

      {/* Ranked results */}
      {matches && matches.length > 0 ? (
        <div className="space-y-3">
          {matches.map((match, i) => {
            const product = getProductById(match.productId);
            if (!product) return null;
            return (
              <motion.div
                key={match.productId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group p-4 rounded-2xl border border-border bg-card hover:shadow-premium transition-all"
              >
                <div className="flex gap-4">
                  {/* Rank badge */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                        i === 0
                          ? "bg-champagne text-foreground"
                          : i === 1
                          ? "bg-foreground/80 text-background"
                          : i === 2
                          ? "bg-foreground/60 text-background"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {i + 1}
                    </div>
                    <span className="text-[9px] text-muted-foreground">
                      {match.score}%
                    </span>
                  </div>

                  {/* Product image */}
                  <button
                    onClick={() => handleProductOpen(product)}
                    className="w-20 sm:w-24 h-28 sm:h-32 rounded-xl overflow-hidden bg-muted flex-shrink-0"
                  >
                    <img
                      src={product.images[0]?.url || product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {product.sellerName}
                    </div>
                    <button
                      onClick={() => handleProductOpen(product)}
                      className="text-sm font-medium leading-tight hover:underline text-left"
                    >
                      {product.name}
                    </button>
                    <div className="flex items-center gap-2 mt-1">
                      <PriceTag
                        price={product.price}
                        originalPrice={product.originalPrice}
                        size="sm"
                      />
                      <StarRating
                        rating={product.rating}
                        size="xs"
                        showNumber
                        reviewCount={product.reviews.length}
                      />
                    </div>

                    {/* AI match reason */}
                    <div className="mt-2 p-2 rounded-lg bg-champagne/[0.06] border border-champagne/20">
                      <p className="text-[11px] text-foreground/80 leading-snug">
                        <span className="text-champagne font-medium">Why: </span>
                        {match.reason}
                      </p>
                    </div>

                    {/* Matched-on chips */}
                    {match.matchedOn.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {match.matchedOn.slice(0, 4).map((m) => (
                          <span
                            key={m}
                            className="px-1.5 py-0.5 text-[9px] rounded-full bg-muted text-foreground/70"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-auto pt-2">
                      <button
                        onClick={() => handleProductOpen(product)}
                        className="flex-1 sm:flex-none px-3 py-1.5 rounded-full bg-foreground text-background text-[11px] font-medium hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-1"
                      >
                        View
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleProductTryOn(product)}
                        className="flex-1 sm:flex-none px-3 py-1.5 rounded-full border border-border text-[11px] font-medium hover:bg-foreground/5 transition-colors inline-flex items-center justify-center gap-1"
                      >
                        <Shirt className="w-3 h-3" />
                        Try On
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl border border-dashed border-border">
          <Sparkles className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm font-medium">No matches found</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Try rephrasing your request, or browse the full marketplace with the
            filters above.
          </p>
        </div>
      )}
    </motion.div>
  );
}

function LoadingState({ query }: { query: string }) {
  return (
    <div className="space-y-4">
      <div className="p-5 rounded-3xl bg-gradient-to-br from-champagne-muted/40 to-transparent border border-champagne/30">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
            <Loader2 className="w-4 h-4 text-background animate-spin" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-wider font-medium text-champagne mb-1">
              AI is searching…
            </div>
            <p className="text-sm text-foreground/80 italic">"{query}"</p>
            <p className="text-[11px] text-muted-foreground mt-2">
              Understanding your intent, filtering by occasion, budget, color, and style…
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl border border-border bg-card flex gap-4 animate-pulse"
          >
            <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
            <div className="w-20 h-28 rounded-xl bg-muted flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-2 w-1/3 bg-muted rounded" />
              <div className="h-3 w-2/3 bg-muted rounded" />
              <div className="h-2 w-1/2 bg-muted rounded" />
              <div className="h-8 w-full bg-muted rounded mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParsedFilters({
  filters,
}: {
  filters: SmartSearchFilters;
}) {
  const chips: { icon: typeof Calendar; label: string }[] = [];
  if (filters.occasion)
    chips.push({ icon: Calendar, label: `Occasion: ${filters.occasion}` });
  if (filters.category && filters.category !== "all")
    chips.push({ icon: Tag, label: `Category: ${filters.category}` });
  if (filters.colors && filters.colors.length > 0)
    chips.push({ icon: Palette, label: `Colors: ${filters.colors.join(", ")}` });
  if (filters.genderHint)
    chips.push({ icon: User, label: `For: ${filters.genderHint}` });
  if (filters.audienceHint)
    chips.push({ icon: User, label: `Audience: ${filters.audienceHint}` });
  if (filters.maxPrice != null || filters.minPrice != null) {
    // The filter amounts are in the filter's own currency — display them as-is.
    const cur = (filters.currency || "USD") as string;
    const curSymbol = { USD: "$", NGN: "₦", EUR: "€", GBP: "£" }[cur] || "$";
    const parts: string[] = [];
    if (filters.minPrice != null)
      parts.push(`over ${curSymbol}${filters.minPrice.toLocaleString()}`);
    if (filters.maxPrice != null)
      parts.push(`under ${curSymbol}${filters.maxPrice.toLocaleString()}`);
    chips.push({ icon: Wallet, label: `Budget: ${parts.join(" and ")}` });
  }
  if (filters.keywords && filters.keywords.length > 0)
    chips.push({ icon: Sparkles, label: `Style: ${filters.keywords.join(", ")}` });

  if (chips.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-champagne/20 flex flex-wrap gap-1.5">
      {chips.map((c, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-background/60 border border-champagne/20 text-foreground/80"
        >
          <c.icon className="w-2.5 h-2.5 text-champagne" />
          {c.label}
        </span>
      ))}
    </div>
  );
}
