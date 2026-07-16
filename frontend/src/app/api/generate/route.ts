import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 90;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = req.headers.get("authorization") || "";

    const res = await fetch(`${API_BASE}/api/ai/generate/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: "AI generation service unavailable." },
      { status: 503 }
    );
  }
}
