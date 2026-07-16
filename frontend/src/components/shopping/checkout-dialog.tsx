"use client";

import { useState, useEffect, useCallback } from "react";
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
  Copy,
  Clock,
  Banknote,
  ExternalLink,
} from "lucide-react";
import { useShoppingStore } from "@/lib/shopping-store";
import { usePaymentStore } from "@/lib/payment-store";
import { useAuthStore } from "@/lib/auth-store";
import type { CheckoutRequest, CheckoutResponse, InitiatePaymentRequest, VirtualAccountResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  singleItem?: CheckoutRequest["items"][0] & { sellerName?: string; sellerId?: string };
  onSuccess?: (orderId: string) => void;
}

type Step = "shipping" | "review" | "payment" | "confirm";

const STEPS: { id: Step; label: string; icon: typeof Truck }[] = [
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "review", label: "Review", icon: ShieldCheck },
  { id: "payment", label: "Pay", icon: Banknote },
  { id: "confirm", label: "Done", icon: Check },
];

export function CheckoutDialog({
  open,
  onOpenChange,
  singleItem,
  onSuccess,
}: CheckoutDialogProps) {
  const { cart, clearCart } = useShoppingStore();
  const { setCurrentTransaction, virtualAccount, setPaymentStatus, paymentStatus, clearPayment } = usePaymentStore();
  const token = useAuthStore((s) => s.token);
  const [step, setStep] = useState<Step>("shipping");
  const [submitting, setSubmitting] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [order, setOrder] = useState<CheckoutResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const [shipping, setShipping] = useState({
    fullName: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "Nigeria",
  });

  const items = singleItem ? [singleItem] : cart;
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shippingCost = subtotal > 500 ? 0 : 18;
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + shippingCost + tax;

  const canProceedFromShipping = () =>
    shipping.fullName.trim() &&
    shipping.email.includes("@") &&
    shipping.address.trim() &&
    shipping.city.trim() &&
    shipping.state.trim() &&
    shipping.zip.trim();

  const handleSubmitOrder = async () => {
    setSubmitting(true);
    try {
      const orderBody: CheckoutRequest = { items, shipping, subtotal, shippingCost, tax, total };
      const orderRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderBody),
      });
      const orderData: CheckoutResponse = await orderRes.json();
      if (!orderData.success || !orderData.orderId) {
        throw new Error(orderData.error || "Failed to create order.");
      }

      const payBody: InitiatePaymentRequest = {
        amount: total,
        order_id: orderData.orderId,
        customer_email: shipping.email,
        customer_phone: shipping.fullName,
        customer_first_name: shipping.fullName.split(" ")[0] || "",
        customer_last_name: shipping.fullName.split(" ").slice(1).join(" ") || "",
      };

      const payRes = await fetch(`${API_BASE}/api/payments/initiate/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payBody),
      });
      const payData: VirtualAccountResponse = await payRes.json();

      if (!payData.status || !payData.data) {
        throw new Error(payData.error || "Failed to generate payment account.");
      }

      setCurrentTransaction(payData.data.transaction_id, {
        account_number: payData.data.virtual_account_number,
        bank_name: payData.data.virtual_bank_name,
        amount: payData.data.amount,
        expires_at: payData.data.expired_at,
      });

      setOrder(orderData);
      setStep("payment");
      if (!singleItem) clearCart();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const checkPaymentStatus = useCallback(async (silent = false) => {
    const tid = usePaymentStore.getState().currentTransactionId;
    if (!tid) return;
    setCheckingPayment(true);
    try {
      const res = await fetch(`${API_BASE}/api/payments/${tid}/status/`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (data?.data?.status === "paid") {
        setPaymentStatus("paid");
        setStep("confirm");
        onSuccess?.(order?.orderId || "");
        if (!silent) toast.success("Payment confirmed!");
      } else if (data?.data?.status === "failed") {
        setPaymentStatus("failed");
        if (!silent) toast.error("Payment failed. Please try again.");
      } else if (!silent) {
        toast.info("Payment still pending. Check back later.");
      }
    } catch {
      if (!silent) toast.error("Could not check payment status.");
    } finally {
      setCheckingPayment(false);
    }
  }, [order, onSuccess, setPaymentStatus]);

  useEffect(() => {
    if (step !== "payment") return;
    const id = setInterval(() => checkPaymentStatus(true), 10000);
    return () => clearInterval(id);
  }, [step, checkPaymentStatus]);

  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!virtualAccount?.expires_at) return;
    const update = () => {
      const diff = new Date(virtualAccount.expires_at).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Expired"); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [virtualAccount?.expires_at]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const reset = () => {
    setStep("shipping");
    setOrder(null);
    clearPayment();
    setShipping({ fullName: "", email: "", address: "", city: "", state: "", zip: "", country: "Nigeria" });
  };

  const handleClose = (o: boolean) => {
    if (!o) setTimeout(() => { if (order) reset(); }, 200);
    onOpenChange(o);
  };

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border flex-shrink-0">
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            {step === "confirm" ? "Order Complete" : "Checkout"}
          </DialogTitle>
          {step !== "confirm" && (
            <div className="flex items-center gap-1 mt-3">
              {STEPS.slice(0, 3).map((s, i) => {
                const isCurrent = step === s.id;
                const isPast = currentStepIndex > i;
                return (
                  <div key={s.id} className="flex items-center gap-1 flex-1">
                    <div className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium transition-colors flex-1 justify-center",
                      isCurrent ? "bg-foreground text-background" : isPast ? "bg-champagne/20 text-foreground" : "bg-muted text-muted-foreground"
                    )}>
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
            {step === "shipping" && (
              <motion.div key="shipping" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="p-6 space-y-4">
                <h3 className="font-serif text-lg">Where should we deliver?</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Full name" value={shipping.fullName} onChange={(v) => setShipping({ ...shipping, fullName: v })} placeholder="Jane Doe" className="col-span-2" />
                  <Field label="Email" value={shipping.email} onChange={(v) => setShipping({ ...shipping, email: v })} placeholder="jane@example.com" type="email" className="col-span-2" />
                  <Field label="Address" value={shipping.address} onChange={(v) => setShipping({ ...shipping, address: v })} placeholder="123 Main St" className="col-span-2" />
                  <Field label="City" value={shipping.city} onChange={(v) => setShipping({ ...shipping, city: v })} placeholder="Lagos" />
                  <Field label="State" value={shipping.state} onChange={(v) => setShipping({ ...shipping, state: v })} placeholder="LA" />
                  <Field label="ZIP" value={shipping.zip} onChange={(v) => setShipping({ ...shipping, zip: v })} placeholder="100001" />
                  <Field label="Country" value={shipping.country} onChange={(v) => setShipping({ ...shipping, country: v })} placeholder="Nigeria" />
                </div>
              </motion.div>
            )}

            {step === "review" && (
              <motion.div key="review" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="p-6 space-y-4">
                <h3 className="font-serif text-lg">Review your order</h3>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-2xl bg-muted/40">
                      <img src={item.image} alt={item.name} className="w-16 h-20 rounded-lg object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.name}</div>
                        <div className="text-[11px] text-muted-foreground">{item.color} · Size {item.size} · Qty {item.quantity}</div>
                        <div className="text-sm font-medium mt-1">₦{(item.price * item.quantity * 1480).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-2xl bg-muted/40 text-xs">
                  <div className="font-medium mb-1">Shipping to</div>
                  <div className="text-muted-foreground">{shipping.fullName}<br />{shipping.address}<br />{shipping.city}, {shipping.state} {shipping.zip}<br />{shipping.country}</div>
                </div>
                <div className="p-3 rounded-2xl border border-border space-y-1.5 text-sm">
                  <Row label={`Items (${items.length})`} value={`₦${(subtotal * 1480).toLocaleString()}`} />
                  <Row label="Shipping" value={shippingCost === 0 ? "Free" : `₦${(shippingCost * 1480).toLocaleString()}`} />
                  <Row label="Tax" value={`₦${(tax * 1480).toLocaleString()}`} muted />
                  <div className="pt-2 border-t border-border flex justify-between font-medium text-base">
                    <span>Total</span>
                    <span>₦{(total * 1480).toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">Pay by bank transfer via ALATPay. Virtual account details will be provided after placing the order.</p>
              </motion.div>
            )}

            {step === "payment" && virtualAccount && (
              <motion.div key="payment" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-6 space-y-6">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-champagne/20 flex items-center justify-center mx-auto mb-3">
                    <Banknote className="w-7 h-7 text-champagne" />
                  </div>
                  <h3 className="font-serif text-xl">Make a bank transfer</h3>
                  <p className="text-sm text-muted-foreground mt-1">Transfer the exact amount to the account below</p>
                </div>

                <div className="p-5 rounded-2xl border-2 border-champagne/30 bg-champagne/5 space-y-4">
                  <div className="text-center">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Amount to pay</div>
                    <div className="text-3xl font-serif font-medium">₦{(parseFloat(virtualAccount.amount) * 1480).toLocaleString()}</div>
                  </div>
                  <div className="space-y-3">
                    <AccountField label="Bank" value={virtualAccount.bank_name} />
                    <AccountField label="Account Number" value={virtualAccount.account_number} onCopy={() => handleCopy(virtualAccount.account_number)} />
                    <AccountField label="Amount" value={`₦${(parseFloat(virtualAccount.amount) * 1480).toLocaleString()}`} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{timeLeft ? `Expires in ${timeLeft}` : `Expires ${new Date(virtualAccount.expires_at).toLocaleString()}`}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button onClick={() => checkPaymentStatus()} disabled={checkingPayment} className="w-full py-3 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-2">
                    {checkingPayment ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking...</> : <><ExternalLink className="w-4 h-4" /> I've made the transfer — Check status</>}
                  </button>
                  {paymentStatus === "paid" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center text-sm text-emerald-600 font-medium">
                      Payment confirmed! Your order is being processed.
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {step === "confirm" && order && (
              <motion.div key="confirm" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-6 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.1 }} className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4">
                  <PartyPopper className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="font-serif text-2xl mb-1">Order placed!</h3>
                <p className="text-sm text-muted-foreground mb-5">Confirmation sent to {shipping.email}</p>
                <div className="p-4 rounded-2xl bg-muted/40 text-left space-y-2 text-sm">
                  <Row label="Order" value={order.orderId!} />
                  <Row label="Delivery" value={order.eta || "5-7 business days"} />
                  <Row label="Total" value={`₦${(total * 1480).toLocaleString()}`} />
                </div>
                <button onClick={() => handleClose(false)} className="mt-5 w-full py-3 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity">Continue shopping</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {step !== "confirm" && step !== "payment" && (
          <div className="border-t border-border p-4 flex items-center justify-between gap-2 flex-shrink-0">
            <div className="text-sm">
              <span className="text-muted-foreground">Total: </span>
              <span className="font-medium font-serif text-base">₦{(total * 1480).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              {step !== "shipping" && (
                <button onClick={() => { const prev = STEPS[currentStepIndex - 1]; if (prev) setStep(prev.id); }}
                  className="px-4 py-2 rounded-full border border-border text-sm font-medium hover:bg-foreground/5 transition-colors inline-flex items-center gap-1">
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>
              )}
              {step === "shipping" && (
                <button onClick={() => { if (!canProceedFromShipping()) { toast.error("Please fill all fields."); return; } setStep("review"); }}
                  className="px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-1">
                  Review order <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
              {step === "review" && (
                <button onClick={handleSubmitOrder} disabled={submitting}
                  className="px-5 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2 disabled:opacity-50">
                  {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing…</> : <>Place order · ₦{(total * 1480).toLocaleString()}</>}
                </button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", className, inputMode }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string; inputMode?: "numeric" | "text" | "email";
}) {
  return (
    <label className={cn("block", className)}>
      <span className="text-[11px] font-medium text-muted-foreground mb-1 block">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode}
        className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground/10" />
    </label>
  );
}

function AccountField({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-background/60">
      <div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-medium mt-0.5">{value}</div>
      </div>
      {onCopy && (
        <button onClick={onCopy} className="p-2 rounded-lg hover:bg-foreground/5 transition-colors" title="Copy">
          <Copy className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={cn(muted ? "text-muted-foreground" : "text-foreground/80")}>{label}</span>
      <span className={cn(muted ? "text-muted-foreground" : "")}>{value}</span>
    </div>
  );
}
