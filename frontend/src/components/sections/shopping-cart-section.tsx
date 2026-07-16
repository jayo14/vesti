"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Trash2, Minus, Plus, ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";
import { useShoppingStore } from "@/lib/shopping-store";
import { useStudioStore } from "@/lib/store";
import { CheckoutDialog } from "@/components/shopping/checkout-dialog";

const EASE = [0.22, 1, 0.36, 1] as const;

export function ShoppingCartSection() {
  const { cart, removeFromCart, updateQuantity, cartCount, cartSubtotal } = useShoppingStore();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const subtotal = cartSubtotal();

  return (
    <section className="min-h-screen pt-28 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-10">
          <Link href="/marketplace" className="p-2 rounded-full hover:bg-foreground/5 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <ShoppingBag className="w-6 h-6" />
          <h1 className="text-3xl font-serif font-medium">Shopping Bag</h1>
          <span className="text-sm text-muted-foreground">({cartCount()} items)</span>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-lg text-muted-foreground">Your bag is empty.</p>
            <Link
              href="/marketplace"
              className="inline-block mt-6 px-6 py-3 rounded-full bg-foreground text-background text-sm font-medium"
            >
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item, i) => (
              <motion.div
                key={`${item.productId}-${item.size}-${item.color}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, ease: EASE }}
                className="flex gap-4 p-4 rounded-2xl border border-border bg-card/50"
              >
                <div className="w-20 h-24 rounded-xl overflow-hidden bg-muted shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/marketplace/${item.productId}`}
                    className="font-medium text-sm hover:underline"
                  >
                    {item.name}
                  </Link>
                  <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    <p>Size: {item.size}</p>
                    <p>Color: {item.color}</p>
                    <p>Seller: {item.sellerName}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(i, item.quantity - 1)}
                        className="p-1 rounded-full hover:bg-foreground/5"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(i, item.quantity + 1)}
                        className="p-1 rounded-full hover:bg-foreground/5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                      <button
                        onClick={() => removeFromCart(i)}
                        className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="border-t border-border pt-6 mt-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-medium">Subtotal</span>
                <span className="text-2xl font-serif">${subtotal.toFixed(2)}</span>
              </div>
              <button
                onClick={() => setCheckoutOpen(true)}
                className="w-full py-3.5 rounded-full bg-foreground text-background text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <CreditCard className="w-4 h-4" />
                Checkout
              </button>
            </div>
          </div>
        )}

        <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
      </div>
    </section>
  );
}
