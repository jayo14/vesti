"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  ArrowDownUp,
  ShoppingBag,
} from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { useShoppingStore } from "@/lib/shopping-store";
import { PRODUCTS } from "@/lib/products";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/shopping/product-card";
import { SmartSearchBar } from "@/components/shopping/smart-search-bar";
import { SmartSearchResults } from "@/components/shopping/smart-search-results";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "dresses", label: "Dresses" },
  { id: "tops", label: "Tops" },
  { id: "outerwear", label: "Outerwear" },
  { id: "bottoms", label: "Bottoms" },
  { id: "knitwear", label: "Knitwear" },
];

const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "price-low", label: "Price: Low → High" },
  { id: "price-high", label: "Price: High → Low" },
  { id: "rating", label: "Top Rated" },
  { id: "newest", label: "Newest" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function MarketplaceSection() {
  const {
    categoryFilter,
    setCategoryFilter,
    searchQuery,
    setSearchQuery,
    setSelectedGarment,
    setCustomGarmentImage,
    setGarmentSource,
    setSelectedMaterial,
    setView,
    openProductPage,
  } = useStudioStore();
  const { cartCount, smartSearchActive, smartSearchResult } = useShoppingStore();
  const [sort, setSort] = useState("featured");

  const showSmartResults =
    smartSearchActive && (smartSearchResult || smartSearchResult === null);

  const filtered = useMemo(() => {
    let list = PRODUCTS.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sellerName.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q))
        );
      }
      return true;
    });
    switch (sort) {
      case "price-low":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list = [...list].sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        list = [...list].reverse();
        break;
      case "featured":
      default:
        list = [...list].sort(
          (a, b) => Number(b.featured || 0) - Number(a.featured || 0)
        );
    }
    return list;
  }, [categoryFilter, searchQuery, sort]);

  const handleTryOn = (p: Product) => {
    setSelectedGarment({
      id: p.id,
      name: p.name,
      designer: p.sellerName,
      designerId: p.sellerId,
      category: p.category,
      price: p.price,
      currency: p.currency,
      image: p.images[0]?.url || p.image,
      description: p.description,
      colors: p.colors.map((c) => c.name),
      sizes: p.sizes.map((s) => s.label),
      tags: p.tags,
      featured: p.featured,
      inStock: p.availability !== "sold-out",
      material: p.material,
    });
    setCustomGarmentImage(null);
    setGarmentSource("marketplace");
    if (p.material) setSelectedMaterial(p.material);
    setView("studio");
  };

  const handleOpenProduct = (p: Product) => {
    openProductPage(p.id);
  };

  return (
    <section className="relative min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium text-foreground/70">
              <Sparkles className="w-3.5 h-3.5 text-champagne" />
              <span>Smart Shopping Marketplace</span>
            </div>
            {cartCount() > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foreground text-background text-xs font-medium">
                <ShoppingBag className="w-3.5 h-3.5" />
                {cartCount()} in bag
              </div>
            )}
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium tracking-[-0.02em]">
            The marketplace
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl">
            Browse pieces from featured designers and stores — or just ask for
            what you need in plain language and let AI find the perfect match.
          </p>
        </motion.div>

        {/* === AI Smart Search hero === */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.05 }}
          className="mb-6"
        >
          <SmartSearchBar onClearResults={() => setSearchQuery("")} />
        </motion.div>

        {/* === Smart search results (when active) === */}
        <AnimatePresence mode="wait">
          {smartSearchActive && (
            <motion.div
              key="smart-results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <SmartSearchResults
                onOpenProduct={handleOpenProduct}
                onTryOn={handleTryOn}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* === Keyword filter bar (hidden while smart search is active) === */}
        {!smartSearchActive && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
              className="mb-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between sticky top-20 z-20 py-3 bg-background/80 backdrop-blur-lg rounded-2xl"
            >
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Or search by keyword…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground/10"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar -mx-1 px-1">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground mr-1 flex-shrink-0" />
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCategoryFilter(c.id)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors",
                        categoryFilter === c.id
                          ? "bg-foreground text-background"
                          : "bg-muted text-foreground/70 hover:bg-foreground/10"
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <div className="relative flex-shrink-0">
                  <ArrowDownUp className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="pl-8 pr-7 py-1.5 text-xs font-medium rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground/10 appearance-none cursor-pointer"
                  >
                    {SORTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>

            {/* Results count */}
            <div className="mb-4 text-xs text-muted-foreground">
              {filtered.length} product{filtered.length !== 1 ? "s" : ""}
              {categoryFilter !== "all" &&
                ` in ${CATEGORIES.find((c) => c.id === categoryFilter)?.label}`}
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                <p>No products match your search. Try a different filter.</p>
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
              >
                {filtered.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    index={i}
                    onOpen={handleOpenProduct}
                    onTryOn={handleTryOn}
                  />
                ))}
              </motion.div>
            )}
          </>
        )}

        {/* Seller callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-foreground to-foreground/90 text-background"
        >
          <div className="grid lg:grid-cols-2 gap-6 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-background/10 text-[11px] font-medium mb-3">
                For Designers & Stores
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-medium leading-tight">
                Sell on AI Fashion Studio
              </h3>
              <p className="text-background/70 text-sm mt-2 max-w-md">
                Upload your products, reach a global audience, and let customers
                try on your pieces virtually before they buy. AI styling
                suggestions drive higher conversion.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 lg:justify-end">
              <button className="px-5 py-2.5 rounded-full bg-background text-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                Become a seller
              </button>
              <button className="px-5 py-2.5 rounded-full border border-background/30 text-sm font-medium hover:bg-background/10 transition-colors">
                Learn more
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
