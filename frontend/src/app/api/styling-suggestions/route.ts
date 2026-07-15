import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/openrouter";
import type {
  StylingsuggestionsRequest,
  StylingsuggestionsResponse,
  StylingSuggestion,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 90;

/**
 * Generate AI styling suggestions for a product using the VLM to analyze the
 * garment image and then propose 3 outfit ideas for different occasions.
 *
 * The suggestions include: title, description, occasion, and pairing pieces.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as StylingsuggestionsRequest;
    const { productImage, productName, productDescription } = body;

    if (!productImage) {
      return NextResponse.json<StylingsuggestionsResponse>(
        { success: false, error: "Product image is required." },
        { status: 400 }
      );
    }

    // Step 1: Use the VLM to analyze the garment and propose styling ideas.
    const raw = await chat([
      {
        role: "assistant",
        content: `You are an expert fashion stylist. Look at this garment (${productName}: ${productDescription}). Propose 3 different styling ideas for different occasions.

Return your answer as a JSON array of 3 objects, each with these fields:
- "title": short name (e.g. "Sunday brunch", "Gallery opening")
- "occasion": the occasion it's styled for
- "description": 1-2 sentences describing the full look and why it works
- "pairing": array of 3-4 pairing pieces (strings, e.g. "White sneakers", "Gold hoop earrings", "Wool tote bag")

Return ONLY the JSON array, no other text. Example:
[{"title":"Sunday brunch","occasion":"Casual weekend","description":"Pair with...","pairing":["...","...","..."]}]`,
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Propose 3 styling ideas for this garment." },
          { type: "image_url", image_url: { url: productImage } },
        ],
      },
    ]);

    // Step 2: Parse the JSON (be defensive — extract the JSON array from the
    // response even if there's surrounding prose).
    let suggestions: StylingSuggestion[] = [];
    try {
      suggestions = JSON.parse(raw);
    } catch {
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          suggestions = JSON.parse(match[0]);
        } catch {
          // give up — fall back to defaults below
        }
      }
    }

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error("No suggestions parsed from AI response.");
    }

    const normalized: StylingSuggestion[] = suggestions.slice(0, 3).map((s, i) => ({
      id: `styling-${Date.now()}-${i}`,
      title: String(s.title || `Look ${i + 1}`).slice(0, 60),
      description: String(s.description || "").slice(0, 400),
      occasion: String(s.occasion || "").slice(0, 80),
      pairing: Array.isArray(s.pairing)
        ? s.pairing.slice(0, 5).map((p) => String(p).slice(0, 80))
        : [],
    }));

    return NextResponse.json<StylingsuggestionsResponse>({
      success: true,
      suggestions: normalized,
    });
  } catch (err) {
    console.error("Styling suggestions API error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json<StylingsuggestionsResponse>(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
