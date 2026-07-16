import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/openrouter";
import type {
  OutfitRecommendationRequest,
  OutfitRecommendationResponse,
  OutfitRecommendation,
  WardrobeCategory,
} from "@/lib/types";
import { serverFetchProducts } from "@/lib/api/server";

export const runtime = "nodejs";
export const maxDuration = 90;

const WEATHER_LABELS: Record<string, string> = {
  hot: "hot (30°C+)",
  warm: "warm (20-30°C)",
  mild: "mild (10-20°C)",
  cool: "cool (5-15°C)",
  cold: "cold (below 5°C)",
  rainy: "rainy",
  snowy: "snowy",
};

const TIME_LABELS: Record<string, string> = {
  morning: "morning",
  afternoon: "afternoon",
  evening: "evening",
  night: "night",
};

const DRESS_CODE_LABELS: Record<string, string> = {
  casual: "casual",
  "smart-casual": "smart-casual",
  business: "business professional",
  formal: "formal",
  "black-tie": "black-tie",
  creative: "creative / expressive",
};

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const body = (await req.json()) as OutfitRecommendationRequest;
    const { occasion, weather, timeOfDay, dressCode, wardrobeItems } = body;

    if (!occasion?.trim()) {
      return NextResponse.json<OutfitRecommendationResponse>(
        { success: false, error: "Please describe the occasion." },
        { status: 400 }
      );
    }

    if (!wardrobeItems || wardrobeItems.length === 0) {
      return NextResponse.json<OutfitRecommendationResponse>(
        {
          success: false,
          error:
            "Your wardrobe is empty. Upload some clothes first so the AI can suggest outfits.",
        },
        { status: 400 }
      );
    }

    // Build a compact description of the user's wardrobe
    const wardrobeSummary = wardrobeItems
      .map(
        (item, i) =>
          `${i + 1}. [ID:${item.id}] ${item.name} (${item.category}) — colors: ${item.colors.join(", ")}, style: ${item.styleTags.join(", ")}, seasons: ${item.seasons.join(", ")}`
      )
      .join("\n");

    // Build a compact list of marketplace products for fill-gap suggestions
    const products = await serverFetchProducts({ limit: 16 });
    const marketplaceSummary = products
      .slice(0, 16)
      .map(
        (p) =>
          `[ID:${p.id}] ${p.name} — ${p.price}, category: ${p.category?.slug || ""}, colors: ${(p.colors || []).map((c) => c.name).join("/")}, tags: ${(p.tags || []).join(",")}`
      )
      .join("\n");

    const systemPrompt = `You are an expert personal stylist. The user has asked for outfit recommendations.

Their wardrobe:
${wardrobeSummary}

Available marketplace products (for gap-filling suggestions only):
${marketplaceSummary}

Context for the outfit:
- Occasion: ${occasion}
- Weather: ${WEATHER_LABELS[weather] || weather}
- Time of day: ${TIME_LABELS[timeOfDay] || timeOfDay}
- Dress code: ${DRESS_CODE_LABELS[dressCode] || dressCode}

Recommend 2-3 complete outfits using items FROM THE USER'S WARDROBE. For each outfit:
1. Combine wardrobe items that work together (use the ID format like "ID:abc123")
2. If the wardrobe is missing a key piece for the occasion (e.g. no formal shoes for a wedding), suggest 1-2 marketplace products to fill the gap (use the marketplace product IDs)
3. Provide styling tips

Return ONLY a JSON array of 2-3 outfit objects:
[
  {
    "title": "short catchy title (e.g. 'Sunday brunch in the park')",
    "rationale": "1-2 sentences explaining why this works for the occasion, weather, and dress code",
    "wardrobeItemIds": ["ID:item-id-1", "ID:item-id-2", ...],
    "marketplaceSuggestions": [
      {"productId": "ID:p1", "reason": "why this filler piece completes the look"}
    ],
    "stylingTips": ["practical styling tip 1", "practical styling tip 2"]
  }
]

Rules:
- Prefer wardrobe items over marketplace suggestions.
- Each outfit must use at least 2 wardrobe items.
- Match colors that go together.
- Match the dress code (don't suggest sneakers for black-tie).
- Match the weather (heavy wool for cold, linen/cotton for hot).
- Use real wardrobe item IDs from the list above (the part after "ID:").
- Use real marketplace product IDs if suggesting fillers.
- Return ONLY the JSON array, no other text.`;

    const raw = await chat([
      { role: "assistant", content: systemPrompt },
      {
        role: "user",
        content: `Suggest 2-3 outfits for: ${occasion} | ${WEATHER_LABELS[weather]} | ${TIME_LABELS[timeOfDay]} | ${DRESS_CODE_LABELS[dressCode]}`,
      },
    ]);

    // Parse JSON defensively
    let outfits: unknown[] = [];
    try {
      outfits = JSON.parse(raw);
    } catch {
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          outfits = JSON.parse(match[0]);
        } catch {
          outfits = [];
        }
      }
    }

    if (!Array.isArray(outfits) || outfits.length === 0) {
      return NextResponse.json<OutfitRecommendationResponse>(
        {
          success: false,
          error: "The AI couldn't generate outfit suggestions. Please try again.",
        },
        { status: 502 }
      );
    }

    // Normalize + validate
    const validWardrobeIds = new Set(wardrobeItems.map((i) => i.id));
    const validProductIds = new Set(products.map((p) => String(p.id)));
    const validCategories: WardrobeCategory[] = [
      "shirts",
      "trousers",
      "dresses",
      "jackets",
      "shoes",
      "bags",
      "watches",
      "accessories",
    ];
    void validCategories; // referenced indirectly via wardrobeItems

    const normalized: OutfitRecommendation[] = outfits.slice(0, 3).map((o, i) => {
      const obj = (o || {}) as Record<string, unknown>;
      const rawIds = Array.isArray(obj.wardrobeItemIds)
        ? (obj.wardrobeItemIds as string[])
        : [];
      // Strip "ID:" prefix if the LLM included it
      const wardrobeItemIds = rawIds
        .map((id) => String(id).replace(/^ID:/i, "").trim())
        .filter((id) => validWardrobeIds.has(id));

      const rawSuggestions = Array.isArray(obj.marketplaceSuggestions)
        ? (obj.marketplaceSuggestions as Array<Record<string, unknown>>)
        : [];
      const marketplaceSuggestions = rawSuggestions
        .map((s) => ({
          productId: String(s.productId || "").replace(/^ID:/i, "").trim(),
          reason: String(s.reason || "").slice(0, 200),
        }))
        .filter((s) => validProductIds.has(s.productId));

      return {
        title: String(obj.title || `Outfit ${i + 1}`).slice(0, 80),
        rationale: String(obj.rationale || "").slice(0, 400),
        wardrobeItemIds,
        marketplaceSuggestions,
        stylingTips: Array.isArray(obj.stylingTips)
          ? (obj.stylingTips as string[]).slice(0, 5).map((t) => String(t).slice(0, 200))
          : [],
      };
    });

    // Filter out any outfits that ended up with zero wardrobe items
    const finalOutfits = normalized.filter((o) => o.wardrobeItemIds.length > 0);

    if (finalOutfits.length === 0) {
      return NextResponse.json<OutfitRecommendationResponse>(
        {
          success: false,
          error:
            "The AI couldn't find a good outfit combination from your wardrobe. Try uploading more varied pieces.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json<OutfitRecommendationResponse>({
      success: true,
      outfits: finalOutfits,
      meta: { durationMs: Date.now() - start, model: "outfit-recommend-v1" },
    });
  } catch (err) {
    console.error("Outfit recommend API error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json<OutfitRecommendationResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
