import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/openrouter";
import type {
  WardrobeAnalysisRequest,
  WardrobeAnalysisResponse,
  WardrobeCategory,
} from "@/lib/types";
import { CATEGORY_INSTRUCTIONS } from "@/lib/wardrobe-categories";

export const runtime = "nodejs";
export const maxDuration = 90;

/**
 * Use the VLM to analyze an uploaded clothing photo and auto-categorize it.
 * Returns: category, name, colors, material, styleTags, seasons, dominantColorHex.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as WardrobeAnalysisRequest;
    const { image } = body;

    if (!image) {
      return NextResponse.json<WardrobeAnalysisResponse>(
        { success: false, error: "Image is required." },
        { status: 400 }
      );
    }

    const isDataUrl = image.startsWith("data:");
    const isHttpUrl = image.startsWith("http");
    if (!isDataUrl && !isHttpUrl) {
      return NextResponse.json<WardrobeAnalysisResponse>(
        { success: false, error: "Invalid image format." },
        { status: 400 }
      );
    }

    const raw = await chat([
      {
        role: "assistant",
        content: `You are a fashion expert analyzing a clothing item from a photo. ${CATEGORY_INSTRUCTIONS}

Analyze the item and return ONLY a JSON object with these fields:
{
  "category": one of the 8 categories above,
  "name": "a short descriptive name (e.g. 'White cotton button-down shirt')",
  "colors": ["dominant color names, max 3"],
  "dominantColorHex": "#RRGGBB of the dominant color",
  "material": "the fabric/material (e.g. 'cotton', 'silk', 'denim', 'wool', 'leather')",
  "styleTags": ["casual", "formal", "minimal", etc. — max 4 tags],
  "seasons": ["spring", "summer", "fall", "winter" — which seasons this works for]
}

Rules:
- If the photo is NOT clothing or an accessory (e.g. a landscape, food, person's face only), set category to "accessories" and name to "Unknown item".
- Be specific but concise. Names should be 3-6 words.
- Colors should be common names (white, black, navy, cream, etc.).
- dominantColorHex must be a valid hex like "#FFFFFF".
- Return ONLY the JSON, no other text.`,
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Analyze this clothing item." },
          { type: "image_url", image_url: { url: image } },
        ],
      },
    ]);

    // Parse JSON defensively
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          // fall through with empty parsed
        }
      }
    }

    // Validate category
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
    const category = validCategories.includes(parsed.category as WardrobeCategory)
      ? (parsed.category as WardrobeCategory)
      : "accessories";

    const item: WardrobeAnalysisResponse["item"] = {
      category,
      name: String(parsed.name || "Clothing item").slice(0, 80),
      colors: Array.isArray(parsed.colors)
        ? (parsed.colors as string[]).slice(0, 3).map((c) => String(c).slice(0, 20))
        : ["Unknown"],
      dominantColorHex:
        typeof parsed.dominantColorHex === "string" &&
        /^#[0-9A-Fa-f]{6}$/.test(parsed.dominantColorHex)
          ? parsed.dominantColorHex
          : "#888888",
      material: typeof parsed.material === "string" ? parsed.material.slice(0, 40) : undefined,
      styleTags: Array.isArray(parsed.styleTags)
        ? (parsed.styleTags as string[]).slice(0, 4).map((t) => String(t).slice(0, 20))
        : [],
      seasons: Array.isArray(parsed.seasons)
        ? (parsed.seasons as string[]).slice(0, 4).map((s) => String(s).slice(0, 10))
        : ["spring", "fall"],
    };

    return NextResponse.json<WardrobeAnalysisResponse>({
      success: true,
      item,
    });
  } catch (err) {
    console.error("Wardrobe analyze API error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json<WardrobeAnalysisResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
