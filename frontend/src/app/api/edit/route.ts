import { NextRequest, NextResponse } from "next/server";
import type { EditResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, prompt } = body;

    if (!image || !prompt) {
      return NextResponse.json<EditResponse>(
        { success: false, error: "Both image and prompt are required." },
        { status: 400 }
      );
    }

    return NextResponse.json<EditResponse>({
      success: false,
      error: "AI edit is being rewired to the vision pipeline. Not yet available.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json<EditResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
