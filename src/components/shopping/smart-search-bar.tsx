"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Search,
  X,
  Loader2,
  Wand2,
  ArrowRight,
  Type,
} from "lucide-react";
import { useShoppingStore } from "@/lib/shopping-store";
import type { SmartSearchResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const EXAMPLE_PROMPTS = [
  "I need something classy for graduation.",
  "Show me office wear under ₦40,000.",
  "Find a wedding outfit for a dark-skinned man.",
  "Show me pink dresses suitable for birthdays.",
  "Elegant evening gown under $1,000",
  "Comfortable linen for a summer wedding",
];

interface SmartSearchBarProps {
  /** Called when the user clears the AI search to return to keyword mode. */
  onClearResults: () => void;
}

export function SmartSearchBar({ onClearResults }: SmartSearchBarProps) {
  const {
    smartSearchActive,
    setSmartSearchActive,
    smartSearchQuery,
    setSmartSearchQuery,
    smartSearchLoading,
    setSmartSearchLoading,
    smartSearchResult,
    setSmartSearchResult,
    setDisplayCurrency,
  } = useShoppingStore();

  const [value, setValue] = useState(smartSearchQuery);
  const [showExamples, setShowExamples] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local value with store
  useEffect(() => {
    setValue(smartSearchQuery);
  }, [smartSearchQuery]);

  // Focus input when switching to AI mode
  useEffect(() => {
    if (smartSearchActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [smartSearchActive]);

  const runSearch = async (query: string) => {
    if (!query.trim()) return;
    setSmartSearchQuery(query);
    setSmartSearchLoading(true);
    setSmartSearchResult(null);
    try {
      const res = await fetch("/api/smart-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data: SmartSearchResponse = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Search failed.");
      }
      // Update display currency FIRST (before setting result) so the results
      // component renders with the correct currency from the start.
      if (data.filters?.currency) {
        setDisplayCurrency(data.filters.currency as never);
      }
      setSmartSearchResult(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Search failed.";
      toast.error(msg);
      setSmartSearchResult({
        success: false,
        error: msg,
      });
    } finally {
      setSmartSearchLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(value);
    setShowExamples(false);
  };

  const handleClear = () => {
    setValue("");
    setSmartSearchQuery("");
    setSmartSearchResult(null);
    onClearResults();
  };

  // AI mode toggle button (shown in keyword mode)
  if (!smartSearchActive) {
    return (
      <button
        onClick={() => setSmartSearchActive(true)}
        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-full glass border border-champagne/30 text-foreground hover:bg-champagne/5 transition-colors"
        title="Switch to AI natural-language search"
      >
        <Wand2 className="w-3.5 h-3.5 text-champagne" />
        <span className="hidden sm:inline">Ask AI</span>
      </button>
    );
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={cn(
            "flex items-center gap-2 pl-4 pr-2 py-2 rounded-full border bg-background transition-all",
            smartSearchLoading
              ? "border-champagne ring-2 ring-champagne/20"
              : "border-champagne/40 focus-within:ring-2 focus-within:ring-champagne/20"
          )}
        >
          {smartSearchLoading ? (
            <Loader2 className="w-4 h-4 text-champagne animate-spin flex-shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-champagne flex-shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setShowExamples(true)}
            onBlur={() => setTimeout(() => setShowExamples(false), 150)}
            placeholder="Ask naturally… e.g. 'I need something classy for graduation'"
            className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
            disabled={smartSearchLoading}
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="w-7 h-7 rounded-full hover:bg-foreground/5 flex items-center justify-center text-muted-foreground"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowExamples((s) => !s)}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-muted hover:bg-foreground/10 transition-colors"
            title="Show example prompts"
          >
            <Sparkles className="w-3 h-3" />
            Examples
          </button>
          <button
            type="submit"
            disabled={!value.trim() || smartSearchLoading}
            className={cn(
              "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0",
              value.trim() && !smartSearchLoading
                ? "bg-foreground text-background hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            Search
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </form>

      {/* Toggle back to keyword search */}
      <div className="mt-1.5 flex items-center justify-between">
        <button
          onClick={() => {
            setSmartSearchActive(false);
            handleClear();
          }}
          className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Type className="w-3 h-3" />
          Use keyword search instead
        </button>
        <span className="inline-flex items-center gap-1 text-[10px] text-champagne">
          <Wand2 className="w-2.5 h-2.5" />
          AI Smart Search
        </span>
      </div>

      {/* Example prompts dropdown */}
      <AnimatePresence>
        {showExamples && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 mt-2 p-3 rounded-2xl glass-strong shadow-premium-lg max-w-md"
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-champagne" />
              Try asking
            </div>
            <div className="space-y-1">
              {EXAMPLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setValue(p);
                    runSearch(p);
                    setShowExamples(false);
                  }}
                  className="block w-full text-left px-2.5 py-2 text-xs rounded-xl hover:bg-foreground/5 transition-colors text-foreground/80"
                >
                  <span className="text-champagne mr-1.5">→</span>
                  {p}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
