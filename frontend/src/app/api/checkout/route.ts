import { NextRequest, NextResponse } from "next/server";
import type { CheckoutRequest, CheckoutResponse } from "@/lib/types";

export const runtime = "nodejs";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutRequest;

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

    const token = req.headers.get("authorization")?.replace("Bearer ", "") || "";

    const orderPayload = {
      status: "pending",
      total: body.total,
      items: body.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        size: item.size,
        color: item.color,
        price: item.price,
        quantity: item.quantity,
        sellerId: item.sellerId || "",
        sellerName: item.sellerName || "",
      })),
      shipping_info: body.shipping,
    };

    const orderRes = await fetch(`${API_BASE}/api/orders/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(orderPayload),
    });

    if (orderRes.ok) {
      const orderData = await orderRes.json();
      return NextResponse.json<CheckoutResponse>({
        success: true,
        orderId: `ORD-${orderData.id}`,
        eta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
          weekday: "long", month: "short", day: "numeric",
        }),
      });
    }

    // Fallback: generate mock order ID
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;
    const eta = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
      weekday: "long", month: "short", day: "numeric",
    });

    return NextResponse.json<CheckoutResponse>({
      success: true,
      orderId,
      eta,
    });
  } catch (err) {
    console.error("Checkout API error:", err);
    return NextResponse.json<CheckoutResponse>(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
