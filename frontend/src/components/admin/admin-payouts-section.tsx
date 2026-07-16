"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowUpRight, Check, X, Ban } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { PayoutRecord } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const money = (v: string | number) => `₦${Number(v || 0).toLocaleString()}`;

export function AdminPayoutsSection() {
  const token = useAuthStore((s) => s.token);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "processing" | "paid" | "failed">("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [actionTarget, setActionTarget] = useState<{ payout: PayoutRecord; action: "mark_paid" | "mark_failed" | "reject" } | null>(null);
  const [actionNote, setActionNote] = useState("");

  const fetchPayouts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/admin/payouts/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setPayouts(await r.json());
      else toast.error("Failed to load payouts");
    } catch {
      toast.error("Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayouts(); }, [token]);

  const processBatch = async () => {
    const pending = payouts.filter((p) => p.status === "pending");
    if (pending.length === 0) { toast.error("No pending payouts"); return; }
    setBatchProcessing(true);
    try {
      const r = await fetch(`${API_BASE}/api/admin/payouts/process/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ payout_ids: pending.map((p) => p.id) }),
      });
      const data = await r.json();
      if (data.status) {
        toast.success(`Processing ${data.processed} payout(s)`);
        fetchPayouts();
      } else {
        toast.error(data.error || "Failed");
      }
    } catch {
      toast.error("Failed to process batch");
    } finally {
      setBatchProcessing(false);
    }
  };

  const finalize = async () => {
    if (!actionTarget || !token) return;
    setBusyId(actionTarget.payout.id);
    try {
      const r = await fetch(`${API_BASE}/api/admin/payouts/${actionTarget.payout.id}/finalize/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: actionTarget.action, note: actionNote.trim() }),
      });
      if (r.ok) {
        toast.success("Payout finalized");
        fetchPayouts();
        setActionTarget(null);
        setActionNote("");
      } else {
        toast.error((await r.json()).detail || "Failed");
      }
    } catch {
      toast.error("Failed to finalize payout");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = filter === "all" ? payouts : payouts.filter((p) => p.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "pending", "processing", "paid", "failed"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-full font-medium capitalize transition-colors ${
              filter === f ? "bg-foreground text-background" : "bg-muted/60 text-muted-foreground hover:text-foreground"
            }`}>
            {f}
          </button>
        ))}
        {payouts.some((p) => p.status === "pending") && (
          <button onClick={processBatch} disabled={batchProcessing}
            className="ml-auto px-3 py-1.5 text-xs rounded-full bg-foreground text-background font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1">
            {batchProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Process all pending
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground py-16 text-center flex flex-col items-center gap-2">
          <ArrowUpRight className="w-8 h-8 opacity-40" />
          No payouts found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <motion.div key={p.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-muted/40 border border-border p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif text-lg font-medium">{money(p.amount)}</span>
                    <StatusPill status={p.status} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {p.designer_username} · {p.bank_name} · {p.bank_account_number} · {p.bank_account_name}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Created {new Date(p.created_at).toLocaleDateString()}
                    {p.paid_at && ` · Paid ${new Date(p.paid_at).toLocaleDateString()}`}
                  </div>
                  {p.reference && <div className="mt-1 text-[11px] text-muted-foreground">Ref: {p.reference}</div>}
                  {p.note && <div className="mt-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-1.5">{p.note}</div>}
                </div>
                {p.status === "processing" && (
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={() => { setActionTarget({ payout: p, action: "mark_paid" }); setActionNote(""); }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600">
                      <Check className="w-3 h-3" /> Mark paid
                    </button>
                    <button onClick={() => { setActionTarget({ payout: p, action: "mark_failed" }); setActionNote(""); }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-red-500/30 text-red-500 text-xs font-medium hover:bg-red-500/10">
                      <X className="w-3 h-3" /> Fail
                    </button>
                    <button onClick={() => { setActionTarget({ payout: p, action: "reject" }); setActionNote(""); }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-amber-500/30 text-amber-500 text-xs font-medium hover:bg-amber-500/10">
                      <Ban className="w-3 h-3" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={!!actionTarget} onOpenChange={(o) => !o && setActionTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionTarget?.action === "mark_paid" ? "Confirm payout" :
               actionTarget?.action === "mark_failed" ? "Mark payout as failed" : "Reject payout"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            {actionTarget?.action === "mark_paid"
              ? `Mark ${money(actionTarget?.payout.amount || 0)} as paid to ${actionTarget?.payout.designer_username}?`
              : `Add a note about why this payout is being ${actionTarget?.action === "reject" ? "rejected" : "marked as failed"}.`}
          </p>
          <textarea value={actionNote} onChange={(e) => setActionNote(e.target.value)}
            className="mt-4 w-full min-h-[100px] rounded-xl border border-border bg-background px-3 py-2 text-sm"
            placeholder="Optional note..." />
          <div className="mt-4 flex items-center justify-end gap-2">
            <button onClick={() => setActionTarget(null)}
              className="px-3 py-1.5 text-xs rounded-full border border-border hover:bg-foreground/5">Cancel</button>
            <button onClick={finalize} disabled={busyId === actionTarget?.payout.id}
              className={`px-3 py-1.5 text-xs rounded-full font-medium disabled:opacity-50 inline-flex items-center gap-1 ${
                actionTarget?.action === "mark_paid"
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-red-500 text-white hover:bg-red-600"
              }`}>
              {busyId === actionTarget?.payout.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Confirm
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-600",
    processing: "bg-blue-500/10 text-blue-600",
    paid: "bg-emerald-500/10 text-emerald-600",
    failed: "bg-red-500/10 text-red-600",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${map[status] || "bg-muted"}`}>
      {status}
    </span>
  );
}
