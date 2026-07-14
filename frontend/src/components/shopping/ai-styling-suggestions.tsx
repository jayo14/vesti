"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import type { Product, StylingSuggestion } from "@/lib/types";
import { useShoppingStore } from "@/lib/shopping-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AIStylingSuggestionsProps {
  product: Product;
}

const OCCASION_COLORS: Record<string, string> = {
  default: "from-champagne/30 to-foreground/5",
};

export function AIStylingSuggestions({ product }: AIStylingSuggestionsProps) {
  const {
    lastStylingProductId,
    stylingSuggestions,
    stylingLoading,
    setStylingLoading,
    setStylingSuggestions,
  } = useShoppingStore();

  const [error, setError] = useState<string | null>(null);

  const cached = lastStylingProductId === product.id ? stylingSuggestions : [];
  const hasSuggestions = cached.length > 0;

  const fetchSuggestions = async () => {
    setError(null);
    setStylingLoading(true);
    try {
      const res = await fetch("/api/styling-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productImage: product.images[0]?.url || product.image,
          productName: product.name,
          productDescription: product.description,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.suggestions) {
        throw new Error(data.error || "Couldn't generate suggestions.");
      }
      setStylingSuggestions(product.id, data.suggestions as StylingSuggestion[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load suggestions.";
      setError(msg);
      toast.error(msg);
    } finally {
      setStylingLoading(false);
    }
  };

  // Auto-fetch on first mount (if no cache for this product)
  useEffect(() => {
    if (lastStylingProductId === product.id && stylingSuggestions.length > 0) return;
    if (stylingLoading) return;
    fetchSuggestions();
  }, [product.id]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-background" />
          </div>
          <div>
            <h4 className="font-serif text-base font-medium leading-tight">
              AI Styling Suggestions
            </h4>
            <p className="text-[11px] text-muted-foreground">
              3 ways to wear this piece
            </p>
          </div>
        </div>
        <button
          onClick={fetchSuggestions}
          disabled={stylingLoading}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 disabled:opacity-50"
          aria-label="Regenerate suggestions"
        >
          <RefreshCw className={cn("w-3 h-3", stylingLoading && "animate-spin")} />
        </button>
      </div>

      {stylingLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded-xl bg-muted/40 animate-pulse">
              <div className="h-3 w-1/2 bg-muted rounded mb-2" />
              <div className="h-2 w-full bg-muted rounded mb-1.5" />
              <div className="h-2 w-2/3 bg-muted rounded" />
            </div>
          ))}
          <div className="text-center text-[11px] text-muted-foreground inline-flex items-center justify-center gap-1.5 w-full">
            <Loader2 className="w-3 h-3 animate-spin" />
            Stylist AI is thinking…
          </div>
        </div>
      )}

      {!stylingLoading && error && (
        <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-destructive">Couldn't load suggestions</p>
            <p className="text-muted-foreground mt-0.5">{error}</p>
            <button
              onClick={fetchSuggestions}
              className="mt-2 text-xs font-medium underline text-foreground"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {!stylingLoading && !error && hasSuggestions && (
        <div className="space-y-2">
          {cached.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "p-3 rounded-xl bg-gradient-to-br border border-border",
                OCCASION_COLORS.default
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium text-sm">{s.title}</div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-background/60 text-foreground/70">
                  {s.occasion}
                </span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed mb-2">
                {s.description}
              </p>
              {s.pairing.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {s.pairing.map((p, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-[10px] rounded-full bg-background/70 border border-border"
                    >
                      + {p}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
