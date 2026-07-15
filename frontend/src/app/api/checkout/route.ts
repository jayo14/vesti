import { NextRequest, NextResponse } from "next/server";
import type { CheckoutRequest, CheckoutResponse } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Demo-only checkout endpoint. Validates the request shape and returns a
 * simulated order confirmation. No payment is actually processed.
 *
 * In production this would integrate with Stripe, Square, etc.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutRequest;

    // Basic validation
    if (!body.items || body.items.length === 0) {
      return NextResponse.json<CheckoutResponse>(
        { success: false, error: "Your cart is empty." },
        { status: 400 }
      );
    }
    if (!body.shipping?.fullName || !body.shipping?.email) {
      return NextResponse.json<CheckoutResponse>(
        { success: false, error: "Shipping name and email are required." },
        { status: 400 }
      );
    }
    // Light card validation — last 4 digits, expiry pattern, 3-4 digit cvc
    const cardDigits = (body.payment?.cardNumber || "").replace(/\s/g, "");
    if (cardDigits.length < 12 || cardDigits.length > 19) {
      return NextResponse.json<CheckoutResponse>(
        { success: false, error: "Invalid card number." },
        { status: 400 }
      );
    }
    if (!/^\d{2}\/\d{2}$/.test(body.payment?.expiry || "")) {
      return NextResponse.json<CheckoutResponse>(
        { success: false, error: "Invalid expiry (use MM/YY)." },
        { status: 400 }
      );
    }
    if (!/^\d{3,4}$/.test(body.payment?.cvc || "")) {
      return NextResponse.json<CheckoutResponse>(
        { success: false, error: "Invalid CVC." },
        { status: 400 }
      );
    }

    // Simulate processing delay
    await new Promise((r) => setTimeout(r, 1200));

    // Generate an order ID
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    // Estimate delivery date (5-10 business days from now)
    const eta = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(
      "en-US",
      { weekday: "long", month: "short", day: "numeric" }
    );

    return NextResponse.json<CheckoutResponse>({
      success: true,
      orderId,
      eta,
    });
  } catch (err) {
    console.error("Checkout API error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json<CheckoutResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
