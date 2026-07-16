"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Banknote,
  Plus,
  Loader2,
} from "lucide-react";
import { usePaymentStore } from "@/lib/payment-store";
import type { PayoutMethodRecord } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const EASE = [0.22, 1, 0.36, 1] as const;

export function EarningsSection() {
  const {
    earningsSummary, setEarningsSummary,
    earnings, setEarnings,
    payouts, setPayouts,
    payoutMethods, setPayoutMethods,
  } = usePaymentStore();
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);

  const [loading, setLoading] = useState(true);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [newMethod, setNewMethod] = useState({ bank_name: "", bank_account_number: "", bank_account_name: "" });
  const [requesting, setRequesting] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [summaryRes, earningsRes, payoutsRes, methodsRes] = await Promise.all([
        fetch(`${API_BASE}/api/earnings/summary/`, { headers }),
        fetch(`${API_BASE}/api/earnings/`, { headers }),
        fetch(`${API_BASE}/api/payouts/history/`, { headers }),
        fetch(`${API_BASE}/api/payout-methods/`, { headers }),
      ]);
      if (summaryRes.status === 401 || earningsRes.status === 401 || payoutsRes.status === 401 || methodsRes.status === 401) {
        logout();
        toast.error("Session expired, please sign in again");
        return;
      }
      if (summaryRes.ok) setEarningsSummary(await summaryRes.json());
      if (earningsRes.ok) setEarnings(await earningsRes.json());
      if (payoutsRes.ok) setPayouts(await payoutsRes.json());
      if (methodsRes.ok) setPayoutMethods(await methodsRes.json());
    } catch {
      toast.error("Failed to load earnings data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (earningsSummary === null && token) fetchData(); }, [token]);

  const addPayoutMethod = async () => {
    if (!token || !newMethod.bank_name || !newMethod.bank_account_number || !newMethod.bank_account_name) return;
    try {
      const res = await fetch(`${API_BASE}/api/payout-methods/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newMethod),
      });
      if (res.ok) {
        toast.success("Bank account added!");
        setShowAddMethod(false);
        setNewMethod({ bank_name: "", bank_account_number: "", bank_account_name: "" });
        fetchData();
      } else {
        toast.error("Failed to add bank account");
      }
    } catch {
      toast.error("Failed to add bank account");
    }
  };

  const requestPayout = async () => {
    if (!token || !payoutAmount) return;
    setRequesting(true);
    try {
      const method = payoutMethods.find((m) => m.is_default) || payoutMethods[0];
      const res = await fetch(`${API_BASE}/api/payouts/request/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: parseFloat(payoutAmount), payout_method_id: method?.id }),
      });
      const data = await res.json();
      if (data.status) {
        toast.success("Payout requested!");
        setPayoutAmount("");
        fetchData();
      } else {
        toast.error(data.error || "Request failed");
      }
    } catch {
      toast.error("Failed to request payout");
    } finally {
      setRequesting(false);
    }
  };

  const cards = [
    { label: "Total Earned", value: `₦${parseFloat(earningsSummary?.total_earned || "0").toLocaleString()}`, icon: TrendingUp, color: "text-champagne" },
    { label: "Available", value: `₦${parseFloat(earningsSummary?.available || "0").toLocaleString()}`, icon: Wallet, color: "text-emerald-500" },
    { label: "Pending", value: `₦${parseFloat(earningsSummary?.pending || "0").toLocaleString()}`, icon: Clock, color: "text-amber-500" },
    { label: "Paid Out", value: `₦${parseFloat(earningsSummary?.paid_out || "0").toLocaleString()}`, icon: CheckCircle2, color: "text-blue-500" },
  ];

  return (
    <section className="relative min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="mb-8">
          <h2 className="font-serif text-4xl sm:text-5xl font-medium tracking-[-0.02em]">My Earnings</h2>
          <p className="mt-2 text-muted-foreground">Track your sales, commissions, and withdrawals</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {cards.map((c) => (
                <div key={c.label} className="p-5 rounded-2xl bg-muted/40 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <c.icon className={cn("w-4 h-4", c.color)} />
                    <span className="text-xs text-muted-foreground">{c.label}</span>
                  </div>
                  <div className="text-2xl font-serif font-medium">{c.value}</div>
                </div>
              ))}
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-5 rounded-2xl border border-border">
                <h3 className="font-serif text-lg mb-4">Request Payout</h3>
                <div className="space-y-3">
                  <input type="number" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} placeholder="Amount (NGN)"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background" />
                  <button onClick={requestPayout} disabled={requesting || !payoutAmount || parseFloat(payoutAmount) <= 0}
                    className="w-full py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2">
                    {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                    Withdraw to bank
                  </button>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="p-5 rounded-2xl border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-lg">Bank Accounts</h3>
                  <button onClick={() => setShowAddMethod(!showAddMethod)} className="p-2 rounded-full hover:bg-foreground/5 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {showAddMethod && (
                  <div className="space-y-2 mb-3 p-3 rounded-xl bg-muted/40">
                    <input value={newMethod.bank_name} onChange={(e) => setNewMethod({ ...newMethod, bank_name: e.target.value })} placeholder="Bank name" className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background" />
                    <input value={newMethod.bank_account_number} onChange={(e) => setNewMethod({ ...newMethod, bank_account_number: e.target.value })} placeholder="Account number" className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background" />
                    <input value={newMethod.bank_account_name} onChange={(e) => setNewMethod({ ...newMethod, bank_account_name: e.target.value })} placeholder="Account name" className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background" />
                    <button onClick={addPayoutMethod} className="w-full py-2 rounded-full bg-foreground text-background text-xs font-medium">Save account</button>
                  </div>
                )}
                {payoutMethods.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No bank accounts added yet</p>
                ) : (
                  <div className="space-y-2">
                    {payoutMethods.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                        <div>
                          <div className="text-sm font-medium">{m.bank_account_name}</div>
                          <div className="text-xs text-muted-foreground">{m.bank_name} · {m.bank_account_number}</div>
                        </div>
                        {m.is_default && <span className="text-[10px] px-2 py-0.5 rounded-full bg-champagne/20 text-champagne font-medium">Default</span>}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h3 className="font-serif text-lg mb-4">Payout History</h3>
              {payouts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No payouts yet</p>
              ) : (
                <div className="space-y-2">
                  {payouts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/40">
                      <div>
                        <div className="text-sm font-medium">₦{parseFloat(p.amount).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()} · {p.bank_name}</div>
                      </div>
                      <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", {
                        "bg-amber-500/10 text-amber-600": p.status === "pending",
                        "bg-blue-500/10 text-blue-600": p.status === "processing",
                        "bg-emerald-500/10 text-emerald-600": p.status === "paid",
                        "bg-red-500/10 text-red-600": p.status === "failed",
                      })}>{p.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
}
