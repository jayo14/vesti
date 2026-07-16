"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertTriangle, Check, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AdminDispute } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const money = (v: string | number) => `₦${Number(v || 0).toLocaleString()}`;

const REASON_LABELS: Record<string, string> = {
  not_delivered: "Not delivered",
  wrong_item: "Wrong item",
  damaged: "Damaged / defective",
  not_as_described: "Not as described",
  refund_request: "Refund not honoured",
  other: "Other",
};

export function AdminDisputesSection() {
  const token = useAuthStore((s) => s.token);
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"open" | "in_review" | "resolved" | "rejected" | "all">("open");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionTarget, setActionTarget] = useState<{ dispute: AdminDispute; action: "resolve" | "reject" | "start_review" } | null>(null);
  const [notes, setNotes] = useState("");
  const [detail, setDetail] = useState<AdminDispute | null>(null);

  const fetchDisputes = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/admin/disputes/?status=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setDisputes(await r.json());
      else toast.error("Failed to load disputes");
    } catch {
      toast.error("Failed to load disputes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDisputes(); }, [token, filter]);

  const resolve = async () => {
    if (!actionTarget || !token) return;
    setBusyId(actionTarget.dispute.id);
    try {
      const r = await fetch(`${API_BASE}/api/admin/disputes/${actionTarget.dispute.id}/resolve/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: actionTarget.action, resolution_notes: notes.trim() }),
      });
      if (r.ok) {
        toast.success("Dispute updated");
        fetchDisputes();
        setActionTarget(null);
        setNotes("");
      } else {
        toast.error((await r.json()).detail || "Failed");
      }
    } catch {
      toast.error("Failed to update dispute");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(["open", "in_review", "resolved", "rejected", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-full font-medium capitalize transition-colors ${
              filter === f ? "bg-foreground text-background" : "bg-muted/60 text-muted-foreground hover:text-foreground"
            }`}>
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : disputes.length === 0 ? (
        <div className="text-sm text-muted-foreground py-16 text-center flex flex-col items-center gap-2">
          <AlertTriangle className="w-8 h-8 opacity-40" />
          No {filter === "all" ? "" : filter + " "}disputes.
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => (
            <motion.div key={d.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-muted/40 border border-border p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusPill status={d.status} />
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {REASON_LABELS[d.reason] || d.reason}
                    </span>
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="font-medium">{d.user_username}</span>
                    <span className="text-muted-foreground"> on order #{d.order} </span>
                    <span className="text-muted-foreground">({money(d.order_total)} · {d.order_status})</span>
                  </div>
                  {d.description && (
                    <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{d.description}</p>
                  )}
                  {d.resolution_notes && (
                    <div className="mt-2 text-xs bg-muted/40 rounded-lg px-3 py-1.5 text-muted-foreground">
                      <span className="font-medium text-foreground">Resolution:</span> {d.resolution_notes}
                    </div>
                  )}
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {new Date(d.created_at).toLocaleString()}
                    {d.resolved_by_username && ` · resolved by ${d.resolved_by_username}`}
                    {d.resolved_at && ` · ${new Date(d.resolved_at).toLocaleDateString()}`}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button onClick={() => setDetail(d)}
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full border border-border text-xs hover:bg-foreground/5">
                    <Eye className="w-3 h-3" /> Detail
                  </button>
                  {d.status === "open" && (
                    <button onClick={() => { setActionTarget({ dispute: d, action: "start_review" }); setNotes(""); }}
                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium hover:bg-blue-500/20">
                      <Eye className="w-3 h-3" /> Start review
                    </button>
                  )}
                  {d.status === "in_review" && (
                    <>
                      <button onClick={() => { setActionTarget({ dispute: d, action: "resolve" }); setNotes(""); }}
                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600">
                        <Check className="w-3 h-3" /> Resolve
                      </button>
                      <button onClick={() => { setActionTarget({ dispute: d, action: "reject" }); setNotes(""); }}
                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full border border-red-500/30 text-red-500 text-xs font-medium hover:bg-red-500/10">
                        <X className="w-3 h-3" /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={!!actionTarget} onOpenChange={(o) => !o && setActionTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionTarget?.action === "start_review" ? "Start review" :
               actionTarget?.action === "resolve" ? "Resolve dispute" : "Reject dispute"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            {actionTarget?.action === "start_review"
              ? "Mark this dispute as under review."
              : "Add resolution notes that the user will be able to see."}
          </p>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            className="mt-4 w-full min-h-[100px] rounded-xl border border-border bg-background px-3 py-2 text-sm"
            placeholder="Resolution notes..." />
          <div className="mt-4 flex items-center justify-end gap-2">
            <button onClick={() => setActionTarget(null)}
              className="px-3 py-1.5 text-xs rounded-full border border-border hover:bg-foreground/5">Cancel</button>
            <button onClick={resolve} disabled={busyId === actionTarget?.dispute.id}
              className="px-3 py-1.5 text-xs rounded-full bg-foreground text-background font-medium hover:opacity-90 disabled:opacity-50">
              {busyId === actionTarget?.dispute.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Dispute #{detail?.id}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <MetaRow label="User" value={detail.user_username} />
                <MetaRow label="Order" value={`#${detail.order} (${detail.order_status})`} />
                <MetaRow label="Total" value={money(detail.order_total)} />
                <MetaRow label="Reason" value={REASON_LABELS[detail.reason] || detail.reason} />
                <MetaRow label="Status" value={detail.status} />
                <MetaRow label="Created" value={new Date(detail.created_at).toLocaleDateString()} />
              </div>
              {detail.description && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Description</div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line bg-muted/40 rounded-xl px-4 py-3">{detail.description}</p>
                </div>
              )}
              {detail.resolution_notes && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Resolution notes</div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line bg-muted/40 rounded-xl px-4 py-3">{detail.resolution_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-red-500/10 text-red-600",
    in_review: "bg-blue-500/10 text-blue-600",
    resolved: "bg-emerald-500/10 text-emerald-600",
    rejected: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${map[status] || "bg-muted"}`}>
      {status.replace("_", " ")}
    </span>
  );
}
