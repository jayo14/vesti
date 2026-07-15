"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CheckoutItem,
  ProductReview,
  StylingSuggestion,
  SmartSearchResponse,
} from "@/lib/types";
import type { CurrencyCode } from "@/lib/currency";

interface CartItem extends CheckoutItem {
  sellerName: string;
}

interface ShoppingState {
  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, qty: number) => void;
  clearCart: () => void;
  cartCount: () => number;
  cartSubtotal: () => number;

  // Last viewed product (for "AI styling suggestions" cache)
  lastStylingProductId: string | null;
  stylingSuggestions: StylingSuggestion[];
  stylingLoading: boolean;
  setStylingLoading: (v: boolean) => void;
  setStylingSuggestions: (productId: string, suggestions: StylingSuggestion[]) => void;

  // Reviews added during this session (appended on top of seed data)
  sessionReviews: Record<string, ProductReview[]>;
  addSessionReview: (productId: string, review: ProductReview) => void;

  // === AI Smart Search ===
  /** Whether the AI search bar is active (vs. the keyword search). */
  smartSearchActive: boolean;
  setSmartSearchActive: (v: boolean) => void;
  /** Last query the user submitted. */
  smartSearchQuery: string;
  setSmartSearchQuery: (q: string) => void;
  /** Loading state for the in-flight search. */
  smartSearchLoading: boolean;
  setSmartSearchLoading: (v: boolean) => void;
  /** Latest search response (null = no search yet). */
  smartSearchResult: SmartSearchResponse | null;
  setSmartSearchResult: (r: SmartSearchResponse | null) => void;
  /** Preferred display currency (defaults to USD; AI search can change it). */
  displayCurrency: CurrencyCode;
  setDisplayCurrency: (c: CurrencyCode) => void;
}

export const useShoppingStore = create<ShoppingState>()(
  persist(
    (set, get) => ({
      cart: [],
      addToCart: (item) =>
        set((state) => {
          // If identical item exists, just bump quantity
          const idx = state.cart.findIndex(
            (c) =>
              c.productId === item.productId &&
              c.size === item.size &&
              c.color === item.color
          );
          if (idx >= 0) {
            const next = [...state.cart];
            next[idx] = {
              ...next[idx],
              quantity: next[idx].quantity + item.quantity,
            };
            return { cart: next };
          }
          return { cart: [...state.cart, item] };
        }),
      removeFromCart: (index) =>
        set((state) => ({ cart: state.cart.filter((_, i) => i !== index) })),
      updateQuantity: (index, qty) =>
        set((state) => {
          const next = [...state.cart];
          if (next[index]) {
            next[index] = { ...next[index], quantity: Math.max(1, qty) };
          }
          return { cart: next };
        }),
      clearCart: () => set({ cart: [] }),
      cartCount: () => get().cart.reduce((sum, c) => sum + c.quantity, 0),
      cartSubtotal: () =>
        get().cart.reduce((sum, c) => sum + c.price * c.quantity, 0),

      lastStylingProductId: null,
      stylingSuggestions: [],
      stylingLoading: false,
      setStylingLoading: (stylingLoading) => set({ stylingLoading }),
      setStylingSuggestions: (productId, suggestions) =>
        set({
          lastStylingProductId: productId,
          stylingSuggestions: suggestions,
          stylingLoading: false,
        }),

      sessionReviews: {},
      addSessionReview: (productId, review) =>
        set((state) => ({
          sessionReviews: {
            ...state.sessionReviews,
            [productId]: [review, ...(state.sessionReviews[productId] || [])],
          },
        })),

      // === AI Smart Search ===
      smartSearchActive: false,
      setSmartSearchActive: (smartSearchActive) => set({ smartSearchActive }),
      smartSearchQuery: "",
      setSmartSearchQuery: (smartSearchQuery) => set({ smartSearchQuery }),
      smartSearchLoading: false,
      setSmartSearchLoading: (smartSearchLoading) => set({ smartSearchLoading }),
      smartSearchResult: null,
      setSmartSearchResult: (smartSearchResult) => set({ smartSearchResult }),
      displayCurrency: "USD",
      setDisplayCurrency: (displayCurrency) => set({ displayCurrency }),
    }),
    {
      name: "ai-fashion-shopping",
      partialize: (state) => ({
        cart: state.cart,
        sessionReviews: state.sessionReviews,
        displayCurrency: state.displayCurrency,
      }),
    }
  )
);
