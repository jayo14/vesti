"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Check, X, ExternalLink, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AdminDesignerApplication } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export function AdminDesignersSection() {
  const token = useAuthStore((s) => s.token);
  const [apps, setApps] = useState<AdminDesignerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminDesignerApplication | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchApps = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/auth/admin/applications/?status=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setApps(await r.json());
      else toast.error("Failed to load applications");
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApps(); }, [token, filter]);

  const approve = async (id: number) => {
    if (!token) return;
    setBusyId(id);
    try {
      const r = await fetch(`${API_BASE}/api/auth/applications/${id}/review/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "approve" }),
      });
      if (r.ok) { toast.success("Application approved"); fetchApps(); }
      else toast.error((await r.json()).detail || "Failed");
    } finally { setBusyId(null); }
  };

  const submitReject = async () => {
    if (!rejectTarget || !token || !rejectReason.trim()) {
      toast.error("A reason is required");
      return;
    }
    setBusyId(rejectTarget.id);
    try {
      const r = await fetch(`${API_BASE}/api/auth/applications/${rejectTarget.id}/review/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "reject", rejection_reason: rejectReason.trim() }),
      });
      if (r.ok) { toast.success("Application rejected"); fetchApps(); setRejectTarget(null); setRejectReason(""); }
      else toast.error((await r.json()).detail || "Failed");
    } finally { setBusyId(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-full font-medium capitalize transition-colors ${
              filter === f ? "bg-foreground text-background" : "bg-muted/60 text-muted-foreground hover:text-foreground"
            }`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : apps.length === 0 ? (
        <div className="text-sm text-muted-foreground py-16 text-center">
          No {filter === "all" ? "" : filter + " "}applications.
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <motion.div key={app.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-muted/40 border border-border p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif text-lg font-medium">{app.brand_name}</h3>
                    <StatusPill status={app.status} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                    <span>{app.user.username}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {app.user.email}</span>
                    <span>·</span>
                    <span>{new Date(app.created_at).toLocaleDateString()}</span>
                  </div>
                  {app.bio && (
                    <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">{app.bio}</p>
                  )}
                  {app.portfolio_links?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {app.portfolio_links.map((link, i) => (
                        <a key={i} href={link} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-background border border-border text-[11px] hover:bg-foreground/5">
                          <ExternalLink className="w-3 h-3" /> Portfolio {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                  {app.status === "rejected" && app.rejection_reason && (
                    <div className="mt-3 text-xs text-red-500">
                      <span className="font-medium">Rejection reason:</span> {app.rejection_reason}
                    </div>
                  )}
                </div>
                {app.status === "pending" && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => approve(app.id)} disabled={busyId === app.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 disabled:opacity-50">
                      {busyId === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Approve
                    </button>
                    <button onClick={() => { setRejectTarget(app); setRejectReason(""); }} disabled={busyId === app.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-red-500/30 text-red-500 text-xs font-medium hover:bg-red-500/10 disabled:opacity-50">
                      <X className="w-3 h-3" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            Give a reason — this is emailed to <span className="font-medium">{rejectTarget?.user.username}</span>.
          </p>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
            className="mt-4 w-full min-h-[120px] rounded-xl border border-border bg-background px-3 py-2 text-sm"
            placeholder="e.g. Portfolio links are unreachable — please resubmit with working URLs." />
          <div className="mt-4 flex items-center justify-end gap-2">
            <button onClick={() => setRejectTarget(null)}
              className="px-3 py-1.5 text-xs rounded-full border border-border hover:bg-foreground/5">
              Cancel
            </button>
            <button onClick={submitReject} disabled={!rejectReason.trim() || busyId === rejectTarget?.id}
              className="px-3 py-1.5 text-xs rounded-full bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50">
              {busyId === rejectTarget?.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Reject application"}
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
    approved: "bg-emerald-500/10 text-emerald-600",
    rejected: "bg-red-500/10 text-red-600",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${map[status] || "bg-muted"}`}>
      {status}
    </span>
  );
}
