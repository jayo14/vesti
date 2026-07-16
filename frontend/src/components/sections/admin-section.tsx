"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  DollarSign,
  Users,
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle2,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import { usePaymentStore } from "@/lib/payment-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const EASE = [0.22, 1, 0.36, 1] as const;

export function AdminSection() {
  const {
    adminDashboard, setAdminDashboard,
    adminTransactions, setAdminTransactions,
    adminPayouts, setAdminPayouts,
  } = usePaymentStore();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "transactions" | "payouts">("dashboard");
  const [processingPayouts, setProcessingPayouts] = useState<number[]>([]);

  const fetchData = async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [dashRes, txRes, payoutRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/dashboard/`, { headers }),
        fetch(`${API_BASE}/api/admin/transactions/`, { headers }),
        fetch(`${API_BASE}/api/admin/payouts/`, { headers }),
      ]);
      if (dashRes.ok) setAdminDashboard(await dashRes.json());
      if (txRes.ok) setAdminTransactions(await txRes.json());
      if (payoutRes.ok) setAdminPayouts(await payoutRes.json());
    } catch {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const processPayout = async (id: number) => {
    setProcessingPayouts((prev) => [...prev, id]);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/api/admin/payouts/process/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ payout_ids: [id] }),
      });
      const data = await res.json();
      if (data.status) {
        toast.success("Payout marked as processing");
        fetchData();
      } else {
        toast.error(data.error || "Failed");
      }
    } catch {
      toast.error("Failed to process payout");
    } finally {
      setProcessingPayouts((prev) => prev.filter((p) => p !== id));
    }
  };

  const tabs = [
    { id: "dashboard" as const, label: "Dashboard", icon: BarChart3 },
    { id: "transactions" as const, label: "Transactions", icon: ShoppingCart },
    { id: "payouts" as const, label: "Payouts", icon: ArrowUpRight },
  ];

  return (
    <section className="relative min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="mb-8">
          <h2 className="font-serif text-4xl sm:text-5xl font-medium tracking-[-0.02em]">Admin Panel</h2>
          <p className="mt-2 text-muted-foreground">Manage transactions, earnings, and designer payouts</p>
        </motion.div>

        <div className="flex gap-1 mb-8 p-1 rounded-2xl bg-muted/60 w-fit">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={cn("px-4 py-2 text-sm font-medium rounded-xl transition-all inline-flex items-center gap-2",
                activeTab === t.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              )}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {activeTab === "dashboard" && adminDashboard && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total Revenue", value: `₦${parseFloat(adminDashboard.total_revenue).toLocaleString()}`, icon: DollarSign, color: "text-champagne" },
                    { label: "Pending Payouts", value: `₦${parseFloat(adminDashboard.pending_payouts).toLocaleString()}`, icon: Clock, color: "text-amber-500" },
                    { label: "Platform Commission", value: `₦${parseFloat(adminDashboard.total_commission).toLocaleString()}`, icon: TrendingUp, color: "text-emerald-500" },
                    { label: "Active Designers", value: adminDashboard.total_designers.toString(), icon: Users, color: "text-blue-500" },
                  ].map((c) => (
                    <div key={c.label} className="p-5 rounded-2xl bg-muted/40 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <c.icon className={cn("w-4 h-4", c.color)} />
                        <span className="text-xs text-muted-foreground">{c.label}</span>
                      </div>
                      <div className="text-2xl font-serif font-medium">{c.value}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-muted/40 border border-border">
                    <div className="text-xs text-muted-foreground mb-1">Total Transactions</div>
                    <div className="text-2xl font-serif">{adminDashboard.total_transactions}</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-muted/40 border border-border">
                    <div className="text-xs text-muted-foreground mb-1">Paid / Pending Payouts</div>
                    <div className="text-2xl font-serif">{adminDashboard.paid_transactions} / {adminDashboard.pending_payout_count}</div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "transactions" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {adminTransactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-12 text-center">No transactions yet</p>
                ) : (
                  <div className="space-y-2">
                    {adminTransactions.map((tx) => (
                      <div key={tx.id} className="p-4 rounded-2xl bg-muted/40">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">₦{parseFloat(tx.amount).toLocaleString()}</span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", {
                            "bg-amber-500/10 text-amber-600": tx.status === "pending",
                            "bg-emerald-500/10 text-emerald-600": tx.status === "paid",
                            "bg-red-500/10 text-red-600": tx.status === "failed",
                          })}>{tx.status}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {tx.user_username} · {tx.payment_method || "bank_transfer"} · {new Date(tx.created_at).toLocaleDateString()}
                        </div>
                        {tx.virtual_account_number && <div className="text-xs text-muted-foreground mt-1">Acct: {tx.virtual_bank_name} · {tx.virtual_account_number}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "payouts" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {adminPayouts.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-12 text-center">No payout requests yet</p>
                ) : (
                  <div className="space-y-2">
                    {adminPayouts.map((p) => (
                      <div key={p.id} className="p-4 rounded-2xl bg-muted/40">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <span className="text-sm font-medium">₦{parseFloat(p.amount).toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground ml-2">· {p.designer_username}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", {
                              "bg-amber-500/10 text-amber-600": p.status === "pending",
                              "bg-blue-500/10 text-blue-600": p.status === "processing",
                              "bg-emerald-500/10 text-emerald-600": p.status === "paid",
                            })}>{p.status}</span>
                            {p.status === "pending" && (
                              <button onClick={() => processPayout(p.id)} disabled={processingPayouts.includes(p.id)}
                                className="px-3 py-1 rounded-full bg-foreground text-background text-[11px] font-medium hover:opacity-90 disabled:opacity-50">
                                {processingPayouts.includes(p.id) ? <Loader2 className="w-3 h-3 animate-spin" /> : "Process"}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.bank_name} · {p.bank_account_number} · {p.bank_account_name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
