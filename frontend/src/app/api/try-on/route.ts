import { NextRequest, NextResponse } from "next/server";
import { chat, generateImage } from "@/lib/openrouter";
import type { TryOnRequest, TryOnResponse } from "@/lib/types";
import { getMaterial, type MaterialSpec } from "@/lib/materials";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Build a high-quality text prompt for the AI image generator that
 * simulates a realistic virtual try-on. We describe the person, the garment,
 * the photographic qualities we want preserved, and (critically) inject
 * material-aware directives so the AI renders the fabric's true behavior
 * rather than forcing impossible constructions.
 */
function buildTryOnPrompt(params: {
  personDescription: string;
  garmentDescription: string;
  preservePose: boolean;
  preserveLighting: boolean;
  material?: MaterialSpec;
}): string {
  const {
    personDescription,
    garmentDescription,
    preservePose,
    preserveLighting,
    material,
  } = params;

  const poseClause = preservePose
    ? "preserving the exact body pose, stance, and posture of the person"
    : "with a natural, confident editorial fashion pose";
  const lightingClause = preserveLighting
    ? "matching the original lighting direction, intensity, and color temperature"
    : "with soft, professional studio lighting that flatters the subject";

  const lines: string[] = [
    "Ultra-realistic full-body fashion editorial photograph of a person wearing the described garment.",
    `Person: ${personDescription}.`,
    `Garment: ${garmentDescription}.`,
  ];

  // === MATERIAL-AWARE DIRECTIVES ===
  // Inject fabric-specific knowledge so the generator renders constructions
  // the material can actually support. This is the key feature: rather than
  // forcing a generic garment render, we teach the AI how this fabric drapes,
  // shines, holds structure, and what shapes are physically impossible.
  if (material) {
    lines.push(
      `FABRIC: ${material.name} (${material.origin}). ${material.promptDirectives}`
    );
    lines.push(
      `Properties — drape: ${material.drape}, weight: ${material.weight}, sheen: ${material.sheen}, structure: ${material.structure}.`
    );
    // Compact positive + negative guidance to keep prompt length manageable.
    lines.push(
      `Suited to: ${material.suitableFor.slice(0, 4).join(", ")}. Avoid impossible constructions: ${material.avoid.slice(0, 2).join(", ")}.`
    );
  } else {
    lines.push(
      "Render the fabric with realistic draping, weight, and texture appropriate to its type."
    );
  }

  lines.push(
    `Composition: ${poseClause}, ${lightingClause}.`,
    "Quality: hyper-detailed, lifelike skin texture, realistic fabric folds, accurate cloth-body fit, soft shadows,",
    "medium format camera, 85mm lens, premium editorial color grade.",
    "Do not alter facial features, body proportions, or skin tone. Photorealistic, 8k."
  );

  // Hard cap on prompt length — upstream image-gen services tend to filter
  // or reject very long prompts (often around 1500–2000 chars). Truncate to
  // 1800 chars max while preserving the leading directives.
  const full = lines.join(" ");
  if (full.length <= 1800) return full;
  // Truncate at sentence boundary if possible.
  const truncated = full.slice(0, 1790);
  const lastDot = truncated.lastIndexOf(".");
  return (lastDot > 1200 ? truncated.slice(0, lastDot + 1) : truncated) + " Photorealistic.";
}

/**
 * Use the VLM to analyze a person photo and produce a concise visual description
 * (body type, pose, hair, skin tone, lighting) so the image generator can preserve it.
 */
async function describePerson(imageDataUrl: string): Promise<string> {
  try {
    const text = await chat([
      {
        role: "assistant",
        content:
          "You are a fashion photography assistant. Describe the person in this image concisely for an AI virtual try-on. Focus on: body type and proportions, exact pose, hair color and style, skin tone, facial features summary, current clothing (briefly), and the lighting direction/quality. Keep it under 80 words. Do not describe the background.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Describe this person for a virtual try-on." },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ]);
    return text.slice(0, 600);
  } catch (err) {
    console.error("describePerson failed:", err);
    return "an adult person with natural proportions, standing in a relaxed pose, with neutral studio lighting";
  }
}

/**
 * Use the VLM to analyze a garment photo and produce a concise visual description
 * (type, color, fabric, fit, details) so the image generator can render it accurately.
 * If a material hint is provided, the describer focuses on cut/construction details
 * that interact with that fabric's behavior.
 */
async function describeGarment(
  imageOrUrl: string,
  fallbackDescription?: string,
  material?: MaterialSpec
): Promise<string> {
  // If it's not a data URL and not an http(s) URL, just return the fallback.
  const isDataUrl = imageOrUrl.startsWith("data:");
  const isHttpUrl = imageOrUrl.startsWith("http");
  if (!isDataUrl && !isHttpUrl) {
    return fallbackDescription || "a stylish designer garment";
  }
  try {
    const materialHint = material
      ? ` The garment is made of ${material.name} — pay special attention to how the cut and construction work with this fabric's ${material.drape} drape and ${material.sheen} sheen.`
      : "";
    const text = await chat([
      {
        role: "assistant",
        content:
          "You are a fashion editor. Describe this garment concisely for an AI virtual try-on. Cover: garment type (dress/top/coat/etc.), color and pattern, fabric/material appearance, fit (slim/relaxed/oversized), length, neckline/silhouette, notable details (buttons, belt, pleats, etc.). Under 80 words. Do not describe the model or background." +
          materialHint,
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Describe this garment for a virtual try-on." },
          { type: "image_url", image_url: { url: imageOrUrl } },
        ],
      },
    ]);
    return text.slice(0, 600) || fallbackDescription || "a stylish designer garment";
  } catch (err) {
    console.error("describeGarment failed:", err);
    return fallbackDescription || "a stylish designer garment";
  }
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const body = (await req.json()) as TryOnRequest;
    const {
      personImage,
      garmentImage,
      garmentDescription,
      preservePose = true,
      preserveLighting = true,
      material: materialId,
    } = body;

    if (!personImage || !garmentImage) {
      return NextResponse.json<TryOnResponse>(
        { success: false, error: "Both personImage and garmentImage are required." },
        { status: 400 }
      );
    }

    // Resolve the material spec (if provided) for material-aware generation.
    const material = materialId ? getMaterial(materialId) : undefined;

    // Step 1: Analyze person + garment in parallel.
    // If we know the material, also pass that hint to the garment describer
    // so it focuses its description on elements the material affects.
    const [personDesc, garmentDesc] = await Promise.all([
      describePerson(personImage),
      describeGarment(garmentImage, garmentDescription, material),
    ]);

    // Step 2: Build prompt and generate the try-on image.
    // We use 768x1344 (portrait 9:16-ish) which best matches full-body poses.
    const prompt = buildTryOnPrompt({
      personDescription: personDesc,
      garmentDescription: garmentDesc,
      preservePose,
      preserveLighting,
      material,
    });

    let resultImage: string | null = null;
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const b64 = await generateImage(prompt, "1024x1792");
        if (b64) {
          resultImage = b64;
          break;
        }
      } catch (err) {
        lastErr = err;
        console.warn(`Image gen attempt ${attempt + 1} failed:`, err);
      }
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1200));
    }

    if (!resultImage) {
      const msg =
        lastErr instanceof Error
          ? `Image generation failed: ${lastErr.message}`
          : "Image generation returned no data. Please try again.";
      return NextResponse.json<TryOnResponse>(
        { success: false, error: msg },
        { status: 502 }
      );
    }

    const durationMs = Date.now() - start;

    return NextResponse.json<TryOnResponse>({
      success: true,
      resultImage,
      meta: {
        durationMs,
        model: "image-gen-v1",
      },
    });
  } catch (err) {
    console.error("Try-on API error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json<TryOnResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
