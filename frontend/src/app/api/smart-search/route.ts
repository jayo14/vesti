import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/openrouter";
import type {
  SmartSearchRequest,
  SmartSearchResponse,
  SmartSearchFilters,
  SmartSearchMatch,
} from "@/lib/types";
import { PRODUCTS } from "@/lib/products";
import {
  detectCurrency,
  parsePriceMention,
  convertToUSD,
  type CurrencyCode,
} from "@/lib/currency";

export const runtime = "nodejs";
export const maxDuration = 90;

/**
 * Build a concise system prompt that teaches the LLM to extract structured
 * search intent from a natural-language fashion query.
 */
const SYSTEM_PROMPT = `You are an AI fashion stylist helping a shopper find the perfect outfit.

The user will describe what they're looking for in natural language. Parse their
query and return ONLY a JSON object with these fields:
{
  "interpretation": "one-sentence restatement of what they want",
  "filters": {
    "occasion": "e.g. graduation, wedding, office, birthday, brunch (string or null)",
    "maxPrice": number or null,
    "minPrice": number or null,
    "currency": "USD" | "NGN" | "EUR" | "GBP",
    "category": "dresses" | "tops" | "outerwear" | "bottoms" | "knitwear" | "accessories" | null,
    "colors": ["pink", "black", ...] or [],
    "sizes": ["S", "M", ...] or [],
    "audienceHint": "any skin-tone / hair / body description mentioned, or null",
    "genderHint": "'male' | 'female' | 'unisex' or null",
    "keywords": ["classy", "elegant", ...] or []
  },
  "summary": "1-2 sentence friendly intro to the results, written in the user's language"
}

Rules:
- Detect currency from symbols (₦=NGN, $=USD, €=EUR, £=GBP). If the user writes
  "₦40,000" set maxPrice=40000 and currency="NGN".
- "Classy", "elegant", "formal" → keywords; don't force a category.
- "Office wear" → category=null, keywords=["office","professional"], occasion="office".
- "Wedding outfit" → occasion="wedding".
- "For a dark-skinned man" → audienceHint="dark-skinned", genderHint="male".
- "Pink dresses" → colors=["pink"], category="dresses".
- Always include "summary" — a warm intro written in the same language/tone as the user.
- Return ONLY the JSON. No prose, no markdown fences.`;

interface LlmParsed {
  interpretation?: string;
  filters?: SmartSearchFilters;
  summary?: string;
}

async function parseQueryWithLLM(query: string): Promise<LlmParsed> {
    const raw = await chat([
      { role: "assistant", content: SYSTEM_PROMPT },
      { role: "user", content: query },
    ]);

  // Strip markdown fences if present
  let jsonStr = raw;
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }

  try {
    return JSON.parse(jsonStr);
  } catch {
    // Try to find a JSON object in the response
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // fall through
      }
    }
    return {};
  }
}

/**
 * Locally rank products against the parsed filters.
 * Each match gets a score (0-100) and a human-readable reason explaining
 * which aspects of the query the product satisfies.
 */
function rankProducts(
  filters: SmartSearchFilters,
  displayCurrency: CurrencyCode
): SmartSearchMatch[] {
  const matches: SmartSearchMatch[] = [];

  // Convert price limits to USD for comparison
  const filterCurrency = (filters.currency as CurrencyCode) || "USD";
  const maxPriceUSD =
    filters.maxPrice != null
      ? convertToUSD(filters.maxPrice, filterCurrency)
      : undefined;
  const minPriceUSD =
    filters.minPrice != null
      ? convertToUSD(filters.minPrice, filterCurrency)
      : undefined;

  for (const product of PRODUCTS) {
    let score = 0;
    const matchedOn: string[] = [];
    const reasonParts: string[] = [];

    // Skip sold-out products entirely (they shouldn't be recommended)
    if (product.availability === "sold-out") continue;

    // Category match (strong signal: +30)
    if (filters.category && filters.category !== "all") {
      if (product.category === filters.category) {
        score += 30;
        matchedOn.push("category");
        reasonParts.push(`matches the ${filters.category} category`);
      }
    }

    // Color match (strong: +25 each)
    if (filters.colors && filters.colors.length > 0) {
      const productColorNames = product.colors.map((c) => c.name.toLowerCase());
      const productTags = product.tags.map((t) => t.toLowerCase());
      for (const wantedColor of filters.colors) {
        const w = wantedColor.toLowerCase();
        const colorMatch = productColorNames.some(
          (pc) => pc.includes(w) || w.includes(pc)
        );
        const tagMatch = productTags.some((t) => t.includes(w));
        if (colorMatch || tagMatch) {
          score += 25;
          matchedOn.push(`color:${wantedColor}`);
          reasonParts.push(`available in ${wantedColor}`);
        }
      }
    }

    // Occasion / keyword match (medium: +15 each)
    const keywordPool = [
      ...(filters.keywords || []).map((k) => k.toLowerCase()),
      filters.occasion?.toLowerCase(),
    ].filter(Boolean) as string[];

    if (keywordPool.length > 0) {
      const haystack = [
        product.name.toLowerCase(),
        product.description.toLowerCase(),
        product.sellerName.toLowerCase(),
        ...product.tags.map((t) => t.toLowerCase()),
      ].join(" ");

      let keywordHits = 0;
      for (const kw of keywordPool) {
        if (haystack.includes(kw)) {
          keywordHits++;
          matchedOn.push(`keyword:${kw}`);
        }
      }
      if (keywordHits > 0) {
        score += Math.min(40, keywordHits * 15);
        reasonParts.push(
          keywordHits === 1
            ? "matches your style keywords"
            : `matches ${keywordHits} of your style keywords`
        );
      }

      // Occasion-specific heuristics
      if (filters.occasion) {
        const occ = filters.occasion.toLowerCase();
        if (
          (occ.includes("wedding") || occ.includes("gala") || occ.includes("graduation")) &&
          (product.category === "dresses" ||
            product.category === "outerwear" ||
            product.tags.some((t) => /evening|formal|silk|velvet|gown/.test(t)))
        ) {
          score += 20;
          matchedOn.push(`occasion:formal`);
          reasonParts.push(`appropriate for ${filters.occasion}`);
        }
        if (
          occ.includes("office") &&
          (product.category === "outerwear" ||
            product.category === "bottoms" ||
            product.category === "tops" ||
            product.tags.some((t) => /tailor|wool|silk|blouse/.test(t)))
        ) {
          score += 15;
          matchedOn.push(`occasion:office`);
          reasonParts.push("polished enough for the office");
        }
        if (
          (occ.includes("birthday") || occ.includes("brunch") || occ.includes("party")) &&
          (product.category === "dresses" ||
            product.tags.some((t) => /vibrant|floral|colorful|playful/.test(t)))
        ) {
          score += 15;
          matchedOn.push(`occasion:celebration`);
          reasonParts.push(`festive for ${filters.occasion}`);
        }
      }
    }

    // Price range (filter — disqualify if out of range; otherwise +10)
    if (maxPriceUSD != null && product.price > maxPriceUSD) {
      continue; // over budget
    }
    if (minPriceUSD != null && product.price < minPriceUSD) {
      continue;
    }
    if (maxPriceUSD != null) {
      score += 10;
      matchedOn.push("within-budget");
      reasonParts.push("within your budget");
    }

    // Size availability
    if (filters.sizes && filters.sizes.length > 0) {
      const hasSize = product.sizes.some(
        (s) => s.inStock && filters.sizes!.includes(s.label)
      );
      if (hasSize) {
        score += 8;
        matchedOn.push("size-available");
      } else {
        score -= 5; // minor penalty
      }
    }

    // Gender hint: if user wants menswear, downweight obvious womenswear
    if (filters.genderHint === "male") {
      const feminineTags = ["silk slip", "lace blouse", "wrap dress", "gown", "pleated skirt"];
      const isFeminine = feminineTags.some((ft) =>
        product.name.toLowerCase().includes(ft)
      );
      if (isFeminine) score -= 30;
      const masculineTags = ["blazer", "parka", "trucker", "cargo", "trousers", "smoking jacket"];
      if (masculineTags.some((mt) => product.name.toLowerCase().includes(mt))) {
        score += 15;
        matchedOn.push("masculine-cut");
        reasonParts.push("cut for menswear");
      }
    }

    // Audience hint (skin tone etc.) — we don't have real skin-tone data on
    // products, but we can suggest pieces in colors that flatter the hint.
    if (filters.audienceHint) {
      const ah = filters.audienceHint.toLowerCase();
      if (ah.includes("dark")) {
        // Jewel tones, bright colors, white, cream flatter dark skin
        const flatteringColors = [
          "champagne",
          "burgundy",
          "plum",
          "camel",
          "white",
          "cream",
          "ivory",
          "sunset",
          "indigo",
        ];
        const hasFlattering = product.colors.some((c) =>
          flatteringColors.some((fc) => c.name.toLowerCase().includes(fc))
        );
        if (hasFlattering) {
          score += 12;
          matchedOn.push("flattering-color");
          reasonParts.push("in a color that flatters dark skin tones");
        }
      }
    }

    // Rating boost (small)
    if (product.rating >= 4.7) {
      score += 5;
    }

    // Featured boost (small)
    if (product.featured) {
      score += 3;
    }

    // Only include products with a positive score
    if (score > 0) {
      const reason =
        reasonParts.length > 0
          ? reasonParts.slice(0, 3).join(", ")
          : "matches your search";

      matches.push({
        productId: product.id,
        score: Math.min(100, score),
        reason: reason.charAt(0).toUpperCase() + reason.slice(1),
        matchedOn,
      });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  // Cap at 8 results
  return matches.slice(0, 8);
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const body = (await req.json()) as SmartSearchRequest;
    const { query } = body;

    if (!query || !query.trim()) {
      return NextResponse.json<SmartSearchResponse>(
        { success: false, error: "Please provide a search query." },
        { status: 400 }
      );
    }

    // Step 1: Use the LLM to parse intent
    let parsed = await parseQueryWithLLM(query);

    // Step 2: Currency is detected locally (always overrides LLM) so we
    // reliably handle ₦ / $ / € / £ symbols.
    const detectedCurrency = detectCurrency(query);
    parsed.filters = {
      ...(parsed.filters || {}),
      currency: detectedCurrency,
    };

    // If the LLM missed a price mention, parse locally using the detected
    // currency. We always re-parse to be safe.
    if (
      parsed.filters.maxPrice == null &&
      parsed.filters.minPrice == null
    ) {
      const mention = parsePriceMention(query, detectedCurrency);
      parsed.filters.maxPrice = parsed.filters.maxPrice ?? mention.maxPrice;
      parsed.filters.minPrice = parsed.filters.minPrice ?? mention.minPrice;
    }

    // Step 3: Rank products locally
    const displayCurrency = (parsed.filters?.currency as CurrencyCode) || "USD";
    const matches = rankProducts(parsed.filters || {}, displayCurrency);

    // Step 4: Generate a friendly summary if the LLM didn't provide one
    let summary = parsed.summary;
    if (!summary) {
      if (matches.length === 0) {
        summary =
          "I couldn't find any products matching that. Try rephrasing or browse the full marketplace.";
      } else {
        summary = `I found ${matches.length} product${
          matches.length !== 1 ? "s" : ""
        } that fit your needs. Here are my top picks:`;
      }
    }

    return NextResponse.json<SmartSearchResponse>({
      success: true,
      interpretation: parsed.interpretation,
      filters: parsed.filters,
      matches,
      summary,
      meta: {
        durationMs: Date.now() - start,
        model: "smart-search-v1",
      },
    });
  } catch (err) {
    console.error("Smart search API error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json<SmartSearchResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
