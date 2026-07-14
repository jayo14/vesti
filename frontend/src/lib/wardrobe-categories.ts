import type { WardrobeCategory } from "./types";

export interface WardrobeCategorySpec {
  id: WardrobeCategory;
  label: string;
  /** Plural label for the section header */
  pluralLabel: string;
  /** Lucide icon name (mapped in the UI component) */
  icon: string;
  /** Description shown in the UI */
  description: string;
}

export const WARDROBE_CATEGORIES: WardrobeCategorySpec[] = [
  {
    id: "shirts",
    label: "Shirts",
    pluralLabel: "Shirts",
    icon: "Shirt",
    description: "Tops, tees, blouses, button-downs",
  },
  {
    id: "trousers",
    label: "Trousers",
    pluralLabel: "Trousers",
    icon: "Ruler",
    description: "Pants, jeans, chinos, shorts",
  },
  {
    id: "dresses",
    label: "Dresses",
    pluralLabel: "Dresses",
    icon: "Sparkles",
    description: "Dresses, jumpsuits, skirts",
  },
  {
    id: "jackets",
    label: "Jackets",
    pluralLabel: "Jackets",
    icon: "Cloud",
    description: "Outerwear, coats, blazers",
  },
  {
    id: "shoes",
    label: "Shoes",
    pluralLabel: "Shoes",
    icon: "Footprints",
    description: "Sneakers, boots, heels, loafers",
  },
  {
    id: "bags",
    label: "Bags",
    pluralLabel: "Bags",
    icon: "ShoppingBag",
    description: "Totes, crossbody, clutches",
  },
  {
    id: "watches",
    label: "Watches",
    pluralLabel: "Watches",
    icon: "Watch",
    description: "Watches and wearables",
  },
  {
    id: "accessories",
    label: "Accessories",
    pluralLabel: "Accessories",
    icon: "Glasses",
    description: "Belts, scarves, hats, jewelry",
  },
];

export const WARDROBE_CATEGORY_MAP: Record<WardrobeCategory, WardrobeCategorySpec> =
  WARDROBE_CATEGORIES.reduce(
    (acc, c) => {
      acc[c.id] = c;
      return acc;
    },
    {} as Record<WardrobeCategory, WardrobeCategorySpec>
  );

/**
 * Mapping used by the AI categorization prompt so the LLM knows exactly
 * which categories to choose from. Sent as part of the system prompt.
 */
export const CATEGORY_INSTRUCTIONS = `Categorize the clothing item into EXACTLY ONE of these 8 categories:
- "shirts" — tops, t-shirts, blouses, button-downs, polos, knitwear worn on the upper body
- "trousers" — pants, jeans, chinos, shorts, leggings, skirts
- "dresses" — dresses, jumpsuits, rompers
- "jackets" — outerwear, coats, blazers, parkas, cardigans worn as outer layer
- "shoes" — sneakers, boots, heels, loafers, sandals
- "bags" — totes, crossbody, clutches, backpacks, handbags
- "watches" — wristwatches and smart wearables
- "accessories" — belts, scarves, hats, sunglasses, jewelry, ties`;
