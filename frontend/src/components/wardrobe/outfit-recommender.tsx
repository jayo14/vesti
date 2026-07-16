"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Wand2,
  Sun,
  Sunset,
  Moon,
  Coffee,
  Cloud,
  CloudRain,
  Snowflake,
  Thermometer,
  type LucideIcon,
} from "lucide-react";
import { useWardrobeStore } from "@/lib/wardrobe-store";
import { useShoppingStore } from "@/lib/shopping-store";
import { useProducts } from "@/lib/api/products";
import type {
  OutfitRecommendation,
  OutfitRecommendationResponse,
  WeatherCondition,
  TimeOfDay,
  DressCode,
  Product,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const WEATHER_OPTIONS: { id: WeatherCondition; label: string; icon: LucideIcon }[] = [
  { id: "hot", label: "Hot", icon: Thermometer },
  { id: "warm", label: "Warm", icon: Sun },
  { id: "mild", label: "Mild", icon: Cloud },
  { id: "cool", label: "Cool", icon: Cloud },
  { id: "cold", label: "Cold", icon: Snowflake },
  { id: "rainy", label: "Rainy", icon: CloudRain },
  { id: "snowy", label: "Snowy", icon: Snowflake },
];

const TIME_OPTIONS: { id: TimeOfDay; label: string; icon: LucideIcon }[] = [
  { id: "morning", label: "Morning", icon: Coffee },
  { id: "afternoon", label: "Afternoon", icon: Sun },
  { id: "evening", label: "Evening", icon: Sunset },
  { id: "night", label: "Night", icon: Moon },
];

const DRESS_CODE_OPTIONS: DressCode[] = [
  "casual",
  "smart-casual",
  "business",
  "formal",
  "black-tie",
  "creative",
];

const OCCASION_PRESETS = [
  "Wedding",
  "Office",
  "Date night",
  "Brunch",
  "Graduation",
  "Job interview",
  "Birthday party",
  "Beach day",
];

interface OutfitRecommenderProps {
  onOpenProduct: (p: Product) => void;
}

export function OutfitRecommender({ onOpenProduct }: OutfitRecommenderProps) {
  const {
    items,
    outfitRequest,
    setOutfitRequest,
    outfitResults,
    setOutfitResults,
    isGeneratingOutfits,
    setIsGeneratingOutfits,
  } = useWardrobeStore();
  const { setSmartSearchActive } = useShoppingStore();
  const { data: allProducts = [] } = useProducts();
  const productById = new Map(allProducts.map((p) => [p.id, p]));

  const [occasionInput, setOccasionInput] = useState(outfitRequest.occasion);

  const handleGenerate = async () => {
    if (!occasionInput.trim()) {
      toast.error("Please describe the occasion.");
      return;
    }
    if (items.length === 0) {
      toast.error("Upload some clothes to your wardrobe first.");
      return;
    }

    setOutfitRequest({ occasion: occasionInput.trim() });
    setIsGeneratingOutfits(true);
    setOutfitResults(null);

    try {
      const res = await fetch("/api/outfit-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occasion: occasionInput.trim(),
          weather: outfitRequest.weather,
          timeOfDay: outfitRequest.timeOfDay,
          dressCode: outfitRequest.dressCode,
          wardrobeItems: items.map((i) => ({
            id: i.id,
            name: i.name,
            category: i.category,
            colors: i.colors,
            styleTags: i.styleTags,
            seasons: i.seasons,
          })),
        }),
      });
      const data: OutfitRecommendationResponse = await res.json();
      if (!data.success || !data.outfits) {
        throw new Error(data.error || "Couldn't generate outfits.");
      }
      setOutfitResults(data.outfits);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate outfits.";
      toast.error(msg);
    } finally {
      setIsGeneratingOutfits(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Input panel */}
      <div className="p-5 rounded-3xl border border-border bg-card">
        <div className="flex items-center gap-2 mb-4">
          <Wand2 className="w-4 h-4 text-champagne" />
          <h3 className="font-serif text-lg font-medium">Get outfit recommendations</h3>
        </div>

        <div className="space-y-4">
          {/* Occasion */}
          <div>
            <label className="text-xs font-medium mb-1.5 block">Occasion</label>
            <input
              type="text"
              value={occasionInput}
              onChange={(e) => setOccasionInput(e.target.value)}
              placeholder="e.g. Wedding, brunch, job interview…"
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground/10"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGenerate();
              }}
            />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {OCCASION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setOccasionInput(preset)}
                  className="px-2 py-0.5 text-[10px] rounded-full bg-muted hover:bg-foreground/10 text-foreground/70 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Weather */}
          <div>
            <label className="text-xs font-medium mb-1.5 block">Weather</label>
            <div className="flex flex-wrap gap-1.5">
              {WEATHER_OPTIONS.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setOutfitRequest({ weather: w.id })}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-full transition-colors",
                    outfitRequest.weather === w.id
                      ? "bg-foreground text-background"
                      : "bg-muted text-foreground/70 hover:bg-foreground/10"
                  )}
                >
                  <w.icon className="w-3 h-3" />
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time of day + Dress code (side by side on larger screens) */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block">Time of day</label>
              <div className="flex flex-wrap gap-1.5">
                {TIME_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setOutfitRequest({ timeOfDay: t.id })}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-full transition-colors",
                      outfitRequest.timeOfDay === t.id
                        ? "bg-foreground text-background"
                        : "bg-muted text-foreground/70 hover:bg-foreground/10"
                    )}
                  >
                    <t.icon className="w-3 h-3" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">Dress code</label>
              <div className="flex flex-wrap gap-1.5">
                {DRESS_CODE_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setOutfitRequest({ dressCode: d })}
                    className={cn(
                      "px-2.5 py-1.5 text-xs font-medium rounded-full capitalize transition-colors",
                      outfitRequest.dressCode === d
                        ? "bg-foreground text-background"
                        : "bg-muted text-foreground/70 hover:bg-foreground/10"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGeneratingOutfits || items.length === 0}
            className={cn(
              "w-full py-3 rounded-full text-sm font-medium transition-all inline-flex items-center justify-center gap-2",
              isGeneratingOutfits || items.length === 0
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-foreground text-background hover:opacity-90 hover:scale-[1.01]"
            )}
          >
            {isGeneratingOutfits ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Stylist AI is curating your outfits…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Recommend Outfits
              </>
            )}
          </button>
          {items.length === 0 && (
            <p className="text-[11px] text-center text-muted-foreground">
              Upload clothes to your wardrobe first to enable recommendations.
            </p>
          )}
        </div>
      </div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {isGeneratingOutfits && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 rounded-2xl border border-border bg-card animate-pulse"
              >
                <div className="h-4 w-1/3 bg-muted rounded mb-2" />
                <div className="h-3 w-full bg-muted rounded mb-1.5" />
                <div className="h-3 w-2/3 bg-muted rounded mb-3" />
                <div className="flex gap-2">
                  <div className="w-16 h-16 bg-muted rounded-xl" />
                  <div className="w-16 h-16 bg-muted rounded-xl" />
                  <div className="w-16 h-16 bg-muted rounded-xl" />
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {!isGeneratingOutfits && outfitResults && outfitResults.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {outfitResults.length} outfit{outfitResults.length !== 1 ? "s" : ""}
              </span>{" "}
              curated for {outfitRequest.occasion.toLowerCase()}
            </div>
            {outfitResults.map((outfit, i) => (
              <OutfitCard
                key={i}
                outfit={outfit}
                index={i}
                wardrobeItems={items}
                productById={productById}
                onOpenProduct={onOpenProduct}
              />
            ))}
          </motion.div>
        )}

        {!isGeneratingOutfits && outfitResults && outfitResults.length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 rounded-2xl border border-dashed border-border text-center"
          >
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">No outfits could be generated</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try uploading more varied pieces to your wardrobe.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OutfitCard({
  outfit,
  index,
  wardrobeItems,
  productById,
  onOpenProduct,
}: {
  outfit: OutfitRecommendation;
  index: number;
  wardrobeItems: ReturnType<typeof useWardrobeStore>["items"];
  productById: Map<string, Product>;
  onOpenProduct: (p: Product) => void;
}) {
  const outfitItems = outfit.wardrobeItemIds
    .map((id) => wardrobeItems.find((i) => i.id === id))
    .filter(Boolean) as NonNullable<
    ReturnType<typeof wardrobeItems.find>
  >[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="p-4 rounded-2xl border border-border bg-card hover:shadow-premium transition-all"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
            index === 0
              ? "bg-champagne text-foreground"
              : "bg-foreground/10 text-foreground/70"
          )}
        >
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-serif text-base font-medium leading-tight">
            {outfit.title}
          </h4>
          <p className="text-xs text-foreground/70 leading-relaxed mt-1">
            {outfit.rationale}
          </p>
        </div>
      </div>

      {/* Wardrobe items used */}
      {outfitItems.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-champagne" />
            From your wardrobe
          </div>
          <div className="flex flex-wrap gap-2">
            {outfitItems.map((item) => (
              <div
                key={item.id}
                className="group relative w-16 h-16 rounded-xl overflow-hidden bg-muted ring-1 ring-border"
                title={item.name}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 to-transparent p-1">
                  <div className="text-[8px] text-background truncate">
                    {item.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Marketplace suggestions */}
      {outfit.marketplaceSuggestions.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-champagne" />
            Suggested from marketplace
          </div>
          <div className="space-y-2">
            {outfit.marketplaceSuggestions.map((sug, i) => {
              const product = productById.get(sug.productId);
              if (!product) return null;
              return (
                <button
                  key={i}
                  onClick={() => onOpenProduct(product)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-muted/40 hover:bg-foreground/[0.03] transition-colors text-left group"
                >
                  <img
                    src={product.images[0]?.url || product.image}
                    alt={product.name}
                    className="w-12 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium leading-tight line-clamp-1">
                      {product.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      ${product.price.toLocaleString()} · {product.sellerName}
                    </div>
                    <div className="text-[10px] text-foreground/70 italic mt-0.5 line-clamp-1">
                      {sug.reason}
                    </div>
                  </div>
                  <div className="text-[10px] font-medium text-champagne flex-shrink-0 group-hover:translate-x-0.5 transition-transform">
                    View →
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Styling tips */}
      {outfit.stylingTips.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
            Styling tips
          </div>
          <ul className="space-y-1">
            {outfit.stylingTips.map((tip, i) => (
              <li
                key={i}
                className="text-[11px] text-foreground/80 leading-relaxed flex items-start gap-1.5"
              >
                <span className="text-champagne flex-shrink-0">·</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
