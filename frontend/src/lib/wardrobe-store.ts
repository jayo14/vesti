"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  WardrobeItem,
  WardrobeCategory,
  OutfitRecommendation,
  WeatherCondition,
  TimeOfDay,
  DressCode,
} from "@/lib/types";

interface WardrobeStoreState {
  // Items in the user's digital wardrobe
  items: WardrobeItem[];
  addItem: (item: WardrobeItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<WardrobeItem>) => void;
  clearWardrobe: () => void;

  // Upload state
  isAnalyzing: boolean;
  analyzingCount: number;
  setIsAnalyzing: (v: boolean) => void;
  setAnalyzingCount: (n: number) => void;

  // Filter
  categoryFilter: WardrobeCategory | "all";
  setCategoryFilter: (c: WardrobeCategory | "all") => void;

  // Outfit recommendation state
  outfitRequest: {
    occasion: string;
    weather: WeatherCondition;
    timeOfDay: TimeOfDay;
    dressCode: DressCode;
  };
  setOutfitRequest: (r: Partial<WardrobeStoreState["outfitRequest"]>) => void;
  outfitResults: OutfitRecommendation[] | null;
  setOutfitResults: (r: OutfitRecommendation[] | null) => void;
  isGeneratingOutfits: boolean;
  setIsGeneratingOutfits: (v: boolean) => void;
}

export const useWardrobeStore = create<WardrobeStoreState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => ({ items: [item, ...state.items] })),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, ...updates } : i
          ),
        })),
      clearWardrobe: () => set({ items: [] }),

      isAnalyzing: false,
      analyzingCount: 0,
      setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
      setAnalyzingCount: (analyzingCount) => set({ analyzingCount }),

      categoryFilter: "all",
      setCategoryFilter: (categoryFilter) => set({ categoryFilter }),

      outfitRequest: {
        occasion: "",
        weather: "mild",
        timeOfDay: "afternoon",
        dressCode: "smart-casual",
      },
      setOutfitRequest: (r) =>
        set((state) => ({ outfitRequest: { ...state.outfitRequest, ...r } })),
      outfitResults: null,
      setOutfitResults: (outfitResults) => set({ outfitResults }),
      isGeneratingOutfits: false,
      setIsGeneratingOutfits: (isGeneratingOutfits) =>
        set({ isGeneratingOutfits }),
    }),
    {
      name: "ai-fashion-wardrobe",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
