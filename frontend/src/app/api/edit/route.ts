import { NextRequest, NextResponse } from "next/server";
import { chat, generateImage } from "@/lib/openrouter";
import type { EditRequest, EditResponse } from "@/lib/types";
import { EDITABLE_COMPONENT_MAP } from "@/lib/editable-components";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Build a tightly-scoped edit prompt that:
 *  1. Asks the VLM to first analyze the current image so we can describe it
 *  2. Combines that description with the user's edit instruction
 *  3. Re-generates an image with the edit applied
 *
 * The prompt instructs the model to preserve the person's identity, pose,
 * and lighting — only modify the requested component.
 */
function buildEditPrompt(params: {
  imageDescription: string;
  editPrompt: string;
  componentLabel?: string;
  preservePerson: boolean;
}): string {
  const { imageDescription, editPrompt, componentLabel, preservePerson } = params;

  const preserveClause = preservePerson
    ? "Preserve the person's exact face, body proportions, skin tone, hairstyle, and pose. Only modify the requested garment detail — do not change the person themselves or the overall composition."
    : "Apply the edit to the garment as requested.";

  const focusClause = componentLabel
    ? `Focus the edit specifically on the ${componentLabel.toLowerCase()}. Do not alter other parts of the garment unless the edit explicitly requires it.`
    : "Apply the edit to the appropriate part of the garment.";

  return [
    "Ultra-realistic full-body fashion editorial photograph based on this reference image.",
    `Reference: ${imageDescription}.`,
    `EDIT INSTRUCTION: ${editPrompt}`,
    focusClause,
    preserveClause,
    "Quality: hyper-detailed, lifelike skin texture, realistic fabric draping with natural folds,",
    "accurate cloth fit to the body, soft natural shadows, accurate cloth-body interaction,",
    "medium format camera, 85mm lens, premium editorial color grade.",
    "Photorealistic, 8k detail.",
  ].join(" ");
}

/**
 * Use the VLM to describe the current image (person + garment + setting) so
 * the image generator can apply the edit while preserving everything else.
 */
async function describeImage(image: string): Promise<string> {
  const isDataUrl = image.startsWith("data:");
  const isHttpUrl = image.startsWith("http");
  if (!isDataUrl && !isHttpUrl) {
    return "a person wearing a stylish garment";
  }
  try {
    const text = await chat([
      {
        role: "assistant",
        content:
          "You are a fashion photography assistant. Describe this image concisely for an AI image editor. Focus on: the person's pose and stance, the garment (type, color, length, fit, neckline, sleeves, notable details like buttons/pockets/embroidery), the lighting, and the background. Keep it under 90 words. Be specific about the garment's current state so the editor knows what to preserve vs. modify.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Describe this image for an AI edit." },
          { type: "image_url", image_url: { url: image } },
        ],
      },
    ]);
    return text.slice(0, 700) || "a person wearing a stylish garment";
  } catch (err) {
    console.error("describeImage failed:", err);
    return "a person wearing a stylish garment";
  }
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const body = (await req.json()) as EditRequest;
    const {
      image,
      prompt,
      component,
      preservePerson = true,
    } = body;

    if (!image || !prompt) {
      return NextResponse.json<EditResponse>(
        { success: false, error: "Both image and prompt are required." },
        { status: 400 }
      );
    }

    // Step 1: Analyze the current image so we can describe it in the prompt.
    const imageDescription = await describeImage(image);

    // Step 2: Resolve the component label (if any) for focused editing.
    const componentLabel = component
      ? EDITABLE_COMPONENT_MAP[component]?.label
      : undefined;

    // Step 3: Build the edit prompt.
    const editPrompt = buildEditPrompt({
      imageDescription,
      editPrompt: prompt,
      componentLabel,
      preservePerson,
    });

    // Step 4: Generate the edited image. Retry up to 2 times on transient
    // upstream failures.
    let resultImage: string | null = null;
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const b64 = await generateImage(editPrompt, "1024x1792");
        if (b64) {
          resultImage = b64;
          break;
        }
      } catch (err) {
        lastErr = err;
        console.warn(`Image edit attempt ${attempt + 1} failed:`, err);
      }
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1200));
    }

    if (!resultImage) {
      const msg =
        lastErr instanceof Error
          ? `Edit failed: ${lastErr.message}`
          : "Edit failed. Please try again.";
      return NextResponse.json<EditResponse>(
        { success: false, error: msg },
        { status: 502 }
      );
    }

    const durationMs = Date.now() - start;

    return NextResponse.json<EditResponse>({
      success: true,
      resultImage,
      meta: { durationMs, model: "image-edit-v1" },
    });
  } catch (err) {
    console.error("Edit API error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json<EditResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
