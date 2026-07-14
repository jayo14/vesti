import { NextRequest, NextResponse } from "next/server";
import type {
  ReviewSubmission,
  ReviewSubmissionResponse,
  ProductReview,
} from "@/lib/types";
import { getProductById } from "@/lib/products";

export const runtime = "nodejs";

/**
 * Demo-only review submission endpoint. Validates the review and returns the
 * constructed review object. In production this would persist to a database.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ReviewSubmission;

    if (!body.productId) {
      return NextResponse.json<ReviewSubmissionResponse>(
        { success: false, error: "Product ID is required." },
        { status: 400 }
      );
    }
    if (!body.author || body.author.trim().length < 2) {
      return NextResponse.json<ReviewSubmissionResponse>(
        { success: false, error: "Please enter your name." },
        { status: 400 }
      );
    }
    if (!body.rating || body.rating < 1 || body.rating > 5) {
      return NextResponse.json<ReviewSubmissionResponse>(
        { success: false, error: "Rating must be between 1 and 5." },
        { status: 400 }
      );
    }
    if (!body.title || body.title.trim().length < 3) {
      return NextResponse.json<ReviewSubmissionResponse>(
        { success: false, error: "Please add a review title." },
        { status: 400 }
      );
    }
    if (!body.body || body.body.trim().length < 10) {
      return NextResponse.json<ReviewSubmissionResponse>(
        { success: false, error: "Review must be at least 10 characters." },
        { status: 400 }
      );
    }

    // Confirm the product exists
    const product = getProductById(body.productId);
    if (!product) {
      return NextResponse.json<ReviewSubmissionResponse>(
        { success: false, error: "Product not found." },
        { status: 404 }
      );
    }

    // Simulate small delay
    await new Promise((r) => setTimeout(r, 400));

    const review: ProductReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      author: body.author.trim().slice(0, 60),
      rating: Math.round(body.rating),
      title: body.title.trim().slice(0, 120),
      body: body.body.trim().slice(0, 2000),
      createdAt: Date.now(),
      verified: true, // demo: mark all new reviews as verified
      helpful: 0,
      size: body.size,
      fit: body.fit,
    };

    return NextResponse.json<ReviewSubmissionResponse>({
      success: true,
      review,
    });
  } catch (err) {
    console.error("Reviews API error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json<ReviewSubmissionResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
