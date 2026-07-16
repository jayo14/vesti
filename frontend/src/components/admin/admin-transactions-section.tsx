"use client";

import { useEffect, useState } from "react";
import { Loader2, Receipt, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";
import type { TransactionRecord } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const money = (v: string | number) => `₦${Number(v || 0).toLocaleString()}`;

export function AdminTransactionsSection() {
  const token = useAuthStore((s) => s.token);
  const [txs, setTxs] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "failed">("all");
  const [search, setSearch] = useState("");

  const fetchTxs = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/admin/transactions/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setTxs(await r.json());
      else toast.error("Failed to load transactions");
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTxs(); }, [token]);

  const filtered = txs.filter((tx) => {
    if (filter !== "all" && tx.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        tx.user_username?.toLowerCase().includes(q) ||
        tx.user_email?.toLowerCase().includes(q) ||
        tx.alatpay_transaction_id?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "paid", "pending", "failed"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-full font-medium capitalize transition-colors ${
              filter === f ? "bg-foreground text-background" : "bg-muted/60 text-muted-foreground hover:text-foreground"
            }`}>
            {f}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-48 pl-8 pr-3 py-1.5 text-xs rounded-full border border-border bg-background"
            placeholder="Search user/tx..." />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground py-16 text-center flex flex-col items-center gap-2">
          <Receipt className="w-8 h-8 opacity-40" />
          No transactions found.
        </div>
      ) : (
        <div className="rounded-2xl bg-muted/40 border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background/60 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">ID</th>
                  <th className="text-left px-4 py-2 font-medium">User</th>
                  <th className="text-right px-4 py-2 font-medium">Amount</th>
                  <th className="text-right px-4 py-2 font-medium">Fee</th>
                  <th className="text-left px-4 py-2 font-medium">Method</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                  <th className="text-left px-4 py-2 font-medium">Date</th>
                  <th className="text-left px-4 py-2 font-medium">Virtual acct</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr key={tx.id} className="border-t border-border hover:bg-background/40">
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{tx.id}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium">{tx.user_username}</div>
                      <div className="text-[11px] text-muted-foreground">{tx.user_email}</div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-serif">{money(tx.amount)}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">{money(tx.fee)}</td>
                    <td className="px-4 py-2.5 text-xs">{tx.payment_method || "bank_transfer"}</td>
                    <td className="px-4 py-2.5">
                      <StatusPill status={tx.status} />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-muted-foreground max-w-[140px] truncate">
                      {tx.virtual_bank_name ? `${tx.virtual_bank_name} · ${tx.virtual_account_number}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-emerald-500/10 text-emerald-600",
    pending: "bg-amber-500/10 text-amber-600",
    failed: "bg-red-500/10 text-red-600",
    expired: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${map[status] || "bg-muted"}`}>
      {status}
    </span>
  );
}
