import { NextRequest, NextResponse } from "next/server";
import type { SmartSearchResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 90;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${API_BASE}/api/ai/smart-search/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Smart search proxy error:", err);
    return NextResponse.json<SmartSearchResponse>(
      { success: false, error: "Search service unavailable." },
      { status: 503 }
    );
  }
}
