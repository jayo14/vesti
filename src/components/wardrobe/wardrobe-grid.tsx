"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shirt,
  Ruler,
  Sparkles,
  Cloud,
  Footprints,
  ShoppingBag,
  Watch,
  Glasses,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useWardrobeStore } from "@/lib/wardrobe-store";
import { WARDROBE_CATEGORIES, WARDROBE_CATEGORY_MAP } from "@/lib/wardrobe-categories";
import type { WardrobeCategory, WardrobeItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ICONS: Record<string, LucideIcon> = {
  Shirt,
  Ruler,
  Sparkles,
  Cloud,
  Footprints,
  ShoppingBag,
  Watch,
  Glasses,
};

interface WardrobeGridProps {
  /** Optional: only show items matching this category */
  filterCategory?: WardrobeCategory | "all";
}

export function WardrobeGrid({ filterCategory: propFilter }: WardrobeGridProps) {
  const { items, removeItem, categoryFilter, setCategoryFilter } = useWardrobeStore();
  const filterCategory = propFilter || categoryFilter;

  // Group items by category
  const grouped = useMemo(() => {
    const map: Record<WardrobeCategory, WardrobeItem[]> = {
      shirts: [],
      trousers: [],
      dresses: [],
      jackets: [],
      shoes: [],
      bags: [],
      watches: [],
      accessories: [],
    };
    for (const item of items) {
      if (filterCategory !== "all" && item.category !== filterCategory) continue;
      map[item.category].push(item);
    }
    return map;
  }, [items, filterCategory]);

  const visibleCategories = WARDROBE_CATEGORIES.filter(
    (c) => filterCategory === "all" || c.id === filterCategory
  ).filter((c) => grouped[c.id].length > 0);

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium mb-1">Your wardrobe is empty</p>
        <p className="text-xs">
          Upload photos of your clothes above and AI will organize them automatically.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Category filter chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mb-6 pb-1">
        <button
          onClick={() => setCategoryFilter("all")}
          className={cn(
            "flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
            filterCategory === "all"
              ? "bg-foreground text-background"
              : "bg-muted text-foreground/70 hover:bg-foreground/10"
          )}
        >
          All ({items.length})
        </button>
        {WARDROBE_CATEGORIES.map((cat) => {
          const count = grouped[cat.id].length + (filterCategory === "all" ? 0 : 0);
          const totalForCat = items.filter((i) => i.category === cat.id).length;
          if (totalForCat === 0) return null;
          const Icon = ICONS[cat.icon] || Shirt;
          const active = filterCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(active ? "all" : cat.id)}
              className={cn(
                "flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "bg-muted text-foreground/70 hover:bg-foreground/10"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label} ({totalForCat})
            </button>
          );
        })}
      </div>

      {/* Grouped sections */}
      <div className="space-y-8">
        {visibleCategories.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No items in this category yet.
          </div>
        )}
        {visibleCategories.map((cat) => {
          const catItems = grouped[cat.id];
          const Icon = ICONS[cat.icon] || Shirt;
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-foreground/5 flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <h4 className="font-serif text-base font-medium">
                  {cat.pluralLabel}
                </h4>
                <span className="text-xs text-muted-foreground">
                  {catItems.length} item{catItems.length !== 1 ? "s" : ""}
                </span>
                <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
                  · {cat.description}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {catItems.map((item) => (
                  <WardrobeItemCard
                    key={item.id}
                    item={item}
                    onDelete={() => {
                      removeItem(item.id);
                      toast.success("Removed from wardrobe.");
                    }}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function WardrobeItemCard({
  item,
  onDelete,
}: {
  item: WardrobeItem;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative rounded-2xl overflow-hidden border border-border bg-card hover:shadow-premium transition-all"
    >
      {/* Image */}
      <div
        className="relative aspect-square overflow-hidden bg-muted cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Dominant color swatch */}
        {item.dominantColorHex && (
          <div
            className="absolute top-2 right-2 w-5 h-5 rounded-full ring-2 ring-background"
            style={{ backgroundColor: item.dominantColorHex }}
            title={`Dominant color: ${item.colors[0] || ""}`}
          />
        )}
        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-2 left-2 w-6 h-6 rounded-full glass-strong flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
          aria-label="Remove from wardrobe"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <div className="text-xs font-medium leading-tight line-clamp-2 mb-1">
          {item.name}
        </div>
        <div className="flex flex-wrap gap-0.5 mb-1.5">
          {item.colors.slice(0, 3).map((c, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 text-[9px] rounded-full bg-muted text-foreground/60"
            >
              {c}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-0.5">
          {item.styleTags.slice(0, 2).map((t, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 text-[9px] rounded-full bg-champagne/10 text-champagne"
            >
              {t}
            </span>
          ))}
        </div>
        {item.material && (
          <div className="text-[9px] text-muted-foreground mt-1 italic">
            {item.material}
          </div>
        )}
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-border bg-muted/30"
          >
            <div className="p-2.5 space-y-1.5 text-[10px]">
              {item.seasons.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Seasons:</span>
                  <span>{item.seasons.join(", ")}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Category:</span>
                <span>{WARDROBE_CATEGORY_MAP[item.category].label}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
