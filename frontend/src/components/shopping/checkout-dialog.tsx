"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  ShoppingBag,
  Truck,
  CreditCard,
  ShieldCheck,
  PartyPopper,
} from "lucide-react";
import { useShoppingStore } from "@/lib/shopping-store";
import type { CheckoutRequest, CheckoutResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Optional single item to buy immediately (Buy Now flow). */
  singleItem?: CheckoutRequest["items"][0] & { sellerName?: string };
  onSuccess?: (orderId: string) => void;
}

type Step = "shipping" | "payment" | "review" | "confirm";

const STEPS: { id: Step; label: string; icon: typeof Truck }[] = [
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "review", label: "Review", icon: ShieldCheck },
  { id: "confirm", label: "Done", icon: Check },
];

export function CheckoutDialog({
  open,
  onOpenChange,
  singleItem,
  onSuccess,
}: CheckoutDialogProps) {
  const { cart, clearCart } = useShoppingStore();
  const [step, setStep] = useState<Step>("shipping");
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<CheckoutResponse | null>(null);

  // Form state
  const [shipping, setShipping] = useState({
    fullName: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
  });
  const [payment, setPayment] = useState({
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  // Items being purchased
  const items = singleItem ? [singleItem] : cart;
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingCost = subtotal > 500 ? 0 : 18;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shippingCost + tax;

  const formatCard = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 19);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };
  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    return digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  const canProceedFromShipping = () =>
    shipping.fullName.trim() &&
    shipping.email.includes("@") &&
    shipping.address.trim() &&
    shipping.city.trim() &&
    shipping.state.trim() &&
    shipping.zip.trim();

  const canProceedFromPayment = () =>
    payment.cardName.trim() &&
    payment.cardNumber.replace(/\s/g, "").length >= 12 &&
    /^\d{2}\/\d{2}$/.test(payment.expiry) &&
    /^\d{3,4}$/.test(payment.cvc);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const body: CheckoutRequest = {
        items,
        shipping,
        payment,
        subtotal,
        shippingCost,
        tax,
        total,
      };
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: CheckoutResponse = await res.json();
      if (!data.success || !data.orderId) {
        throw new Error(data.error || "Checkout failed.");
      }
      setOrder(data);
      setStep("confirm");
      if (!singleItem) clearCart();
      onSuccess?.(data.orderId);
      toast.success("Order placed successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep("shipping");
    setOrder(null);
    setShipping({
      fullName: "",
      email: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      country: "United States",
    });
    setPayment({ cardName: "", cardNumber: "", expiry: "", cvc: "" });
  };

  const handleClose = (o: boolean) => {
    if (!o) {
      // Don't reset on close if order is confirmed — preserve state for view
      setTimeout(() => {
        if (order) reset();
      }, 200);
    }
    onOpenChange(o);
  };

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border flex-shrink-0">
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            {step === "confirm" ? "Order Confirmed" : "Secure Checkout"}
          </DialogTitle>
          {step !== "confirm" && (
            <div className="flex items-center gap-1 mt-3">
              {STEPS.slice(0, 3).map((s, i) => {
                const isCurrent = step === s.id;
                const isPast = currentStepIndex > i;
                return (
                  <div key={s.id} className="flex items-center gap-1 flex-1">
                    <div
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium transition-colors flex-1 justify-center",
                        isCurrent
                          ? "bg-foreground text-background"
                          : isPast
                          ? "bg-champagne/20 text-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isPast ? <Check className="w-3 h-3" /> : <s.icon className="w-3 h-3" />}
                      {s.label}
                    </div>
                    {i < 2 && <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* STEP 1: SHIPPING */}
            {step === "shipping" && (
              <motion.div
                key="shipping"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="p-6 space-y-4"
              >
                <h3 className="font-serif text-lg">Where should we ship it?</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Full name"
                    value={shipping.fullName}
                    onChange={(v) => setShipping({ ...shipping, fullName: v })}
                    placeholder="Jane Doe"
                    className="col-span-2"
                  />
                  <Field
                    label="Email"
                    value={shipping.email}
                    onChange={(v) => setShipping({ ...shipping, email: v })}
                    placeholder="jane@example.com"
                    type="email"
                    className="col-span-2"
                  />
                  <Field
                    label="Street address"
                    value={shipping.address}
                    onChange={(v) => setShipping({ ...shipping, address: v })}
                    placeholder="123 Main St"
                    className="col-span-2"
                  />
                  <Field
                    label="City"
                    value={shipping.city}
                    onChange={(v) => setShipping({ ...shipping, city: v })}
                    placeholder="New York"
                  />
                  <Field
                    label="State / Province"
                    value={shipping.state}
                    onChange={(v) => setShipping({ ...shipping, state: v })}
                    placeholder="NY"
                  />
                  <Field
                    label="ZIP / Postal code"
                    value={shipping.zip}
                    onChange={(v) => setShipping({ ...shipping, zip: v })}
                    placeholder="10001"
                  />
                  <Field
                    label="Country"
                    value={shipping.country}
                    onChange={(v) => setShipping({ ...shipping, country: v })}
                    placeholder="United States"
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 2: PAYMENT */}
            {step === "payment" && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="p-6 space-y-4"
              >
                <h3 className="font-serif text-lg flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-champagne" />
                  Payment details
                </h3>
                <p className="text-xs text-muted-foreground -mt-2">
                  🔒 Demo only — no real payment will be processed. Use any test card.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Name on card"
                    value={payment.cardName}
                    onChange={(v) => setPayment({ ...payment, cardName: v })}
                    placeholder="Jane Doe"
                    className="col-span-2"
                  />
                  <Field
                    label="Card number"
                    value={payment.cardNumber}
                    onChange={(v) => setPayment({ ...payment, cardNumber: formatCard(v) })}
                    placeholder="4242 4242 4242 4242"
                    className="col-span-2"
                    inputMode="numeric"
                  />
                  <Field
                    label="Expiry (MM/YY)"
                    value={payment.expiry}
                    onChange={(v) => setPayment({ ...payment, expiry: formatExpiry(v) })}
                    placeholder="12/27"
                  />
                  <Field
                    label="CVC"
                    value={payment.cvc}
                    onChange={(v) =>
                      setPayment({
                        ...payment,
                        cvc: v.replace(/\D/g, "").slice(0, 4),
                      })
                    }
                    placeholder="123"
                    inputMode="numeric"
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 3: REVIEW */}
            {step === "review" && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="p-6 space-y-4"
              >
                <h3 className="font-serif text-lg">Review your order</h3>

                {/* Items */}
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div
                      key={i}
                      className="flex gap-3 p-3 rounded-2xl bg-muted/40"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {item.color} · Size {item.size} · Qty {item.quantity}
                        </div>
                        <div className="text-sm font-medium mt-1">
                          ${(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping summary */}
                <div className="p-3 rounded-2xl bg-muted/40 text-xs">
                  <div className="font-medium mb-1">Shipping to</div>
                  <div className="text-muted-foreground">
                    {shipping.fullName}
                    <br />
                    {shipping.address}
                    <br />
                    {shipping.city}, {shipping.state} {shipping.zip}
                    <br />
                    {shipping.country}
                  </div>
                </div>

                {/* Totals */}
                <div className="p-3 rounded-2xl border border-border space-y-1.5 text-sm">
                  <Row label={`Subtotal (${items.length} item${items.length !== 1 ? "s" : ""})`} value={`$${subtotal.toLocaleString()}`} />
                  <Row label="Shipping" value={shippingCost === 0 ? "Free" : `$${shippingCost}`} />
                  <Row label="Tax (est.)" value={`$${tax.toLocaleString()}`} muted />
                  <div className="pt-2 border-t border-border flex justify-between font-medium text-base">
                    <span>Total</span>
                    <span>${total.toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground text-center">
                  By placing this order you agree to our Terms of Service. This is a
                  demo experience — no charge will be made.
                </p>
              </motion.div>
            )}

            {/* STEP 4: CONFIRM */}
            {step === "confirm" && order && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4"
                >
                  <PartyPopper className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="font-serif text-2xl mb-1">Order placed!</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  A confirmation has been sent to {shipping.email}
                </p>

                <div className="p-4 rounded-2xl bg-muted/40 text-left space-y-2 text-sm">
                  <Row label="Order number" value={order.orderId!} />
                  <Row label="Estimated delivery" value={order.eta!} />
                  <Row label="Total paid" value={`$${total.toLocaleString()}`} />
                  <Row label="Items" value={`${items.length}`} />
                </div>

                <button
                  onClick={() => handleClose(false)}
                  className="mt-5 w-full py-3 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Continue shopping
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        {step !== "confirm" && (
          <div className="border-t border-border p-4 flex items-center justify-between gap-2 flex-shrink-0">
            <div className="text-sm">
              <span className="text-muted-foreground">Total: </span>
              <span className="font-medium font-serif text-base">
                ${total.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {step !== "shipping" && (
                <button
                  onClick={() => {
                    const prev = STEPS[currentStepIndex - 1];
                    if (prev) setStep(prev.id);
                  }}
                  className="px-4 py-2 rounded-full border border-border text-sm font-medium hover:bg-foreground/5 transition-colors inline-flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>
              )}
              {step === "shipping" && (
                <button
                  onClick={() => {
                    if (!canProceedFromShipping()) {
                      toast.error("Please fill in all shipping fields.");
                      return;
                    }
                    setStep("payment");
                  }}
                  className="px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-1"
                >
                  Continue to payment <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
              {step === "payment" && (
                <button
                  onClick={() => {
                    if (!canProceedFromPayment()) {
                      toast.error("Please complete payment fields.");
                      return;
                    }
                    setStep("review");
                  }}
                  className="px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-1"
                >
                  Review order <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
              {step === "review" && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-5 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…
                    </>
                  ) : (
                    <>
                      Place order · ${total.toLocaleString()}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  inputMode?: "numeric" | "text" | "email";
}) {
  return (
    <label className={cn("block", className)}>
      <span className="text-[11px] font-medium text-muted-foreground mb-1 block">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground/10"
      />
    </label>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className={cn(muted ? "text-muted-foreground" : "text-foreground/80")}>
        {label}
      </span>
      <span className={cn(muted ? "text-muted-foreground" : "")}>{value}</span>
    </div>
  );
}
