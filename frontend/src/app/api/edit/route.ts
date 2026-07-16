import { NextRequest, NextResponse } from "next/server";
import type { EditResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = req.headers.get("authorization") || "";

    if (!body.image || !body.prompt) {
      return NextResponse.json<EditResponse>(
        { success: false, error: "Both image and prompt are required." },
        { status: 400 }
      );
    }

    const res = await fetch(`${API_BASE}/api/ai/edit/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Edit proxy error:", err);
    return NextResponse.json<EditResponse>(
      { success: false, error: "Edit service unavailable." },
      { status: 503 }
    );
  }
}
