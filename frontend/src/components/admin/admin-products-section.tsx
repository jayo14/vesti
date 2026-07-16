"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Check, X, Image as ImageIcon, Package } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AdminPendingProduct } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export function AdminProductsSection() {
  const token = useAuthStore((s) => s.token);
  const [products, setProducts] = useState<AdminPendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending_review" | "published" | "rejected" | "draft" | "all">("pending_review");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminPendingProduct | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [preview, setPreview] = useState<AdminPendingProduct | null>(null);

  const fetchProducts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/admin/products/?status=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setProducts(await r.json());
      else toast.error("Failed to load products");
    } catch { toast.error("Failed to load products"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [token, filter]);

  const approve = async (id: number) => {
    if (!token) return;
    setBusyId(id);
    try {
      const r = await fetch(`${API_BASE}/api/admin/products/${id}/review/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "approve" }),
      });
      if (r.ok) { toast.success("Product published"); fetchProducts(); }
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
      const r = await fetch(`${API_BASE}/api/admin/products/${rejectTarget.id}/review/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "reject", rejection_reason: rejectReason.trim() }),
      });
      if (r.ok) { toast.success("Product rejected"); fetchProducts(); setRejectTarget(null); setRejectReason(""); }
      else toast.error((await r.json()).detail || "Failed");
    } finally { setBusyId(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {(["pending_review", "published", "rejected", "draft", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
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
      ) : products.length === 0 ? (
        <div className="text-sm text-muted-foreground py-16 text-center flex flex-col items-center gap-2">
          <Package className="w-8 h-8 opacity-40" />
          No products in this queue.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((p) => (
            <motion.div key={p.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-muted/40 border border-border overflow-hidden">
              <button onClick={() => setPreview(p)} className="w-full aspect-video bg-muted flex items-center justify-center overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                )}
              </button>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-serif text-base font-medium truncate">{p.name}</h3>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {p.designer_name || "—"} · {p.category || "—"} · {p.currency} {parseFloat(p.price).toLocaleString()}
                    </div>
                  </div>
                  <StatusPill status={p.moderation_status} />
                </div>
                {p.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                )}
                {p.rejection_reason && (
                  <div className="text-[11px] text-red-500">
                    <span className="font-medium">Rejected:</span> {p.rejection_reason}
                  </div>
                )}
                {p.moderation_status === "pending_review" && (
                  <div className="flex items-center gap-2 pt-2">
                    <button onClick={() => approve(p.id)} disabled={busyId === p.id}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-600 disabled:opacity-50">
                      {busyId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Approve
                    </button>
                    <button onClick={() => { setRejectTarget(p); setRejectReason(""); }} disabled={busyId === p.id}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full border border-red-500/30 text-red-500 text-xs font-medium hover:bg-red-500/10 disabled:opacity-50">
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
          <DialogHeader><DialogTitle>Reject product</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            The designer will see this reason next to <span className="font-medium">{rejectTarget?.name}</span>.
          </p>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
            className="mt-4 w-full min-h-[120px] rounded-xl border border-border bg-background px-3 py-2 text-sm"
            placeholder="e.g. Photos are too low resolution — reshoot at 1500×1500 minimum." />
          <div className="mt-4 flex items-center justify-end gap-2">
            <button onClick={() => setRejectTarget(null)}
              className="px-3 py-1.5 text-xs rounded-full border border-border hover:bg-foreground/5">Cancel</button>
            <button onClick={submitReject} disabled={!rejectReason.trim() || busyId === rejectTarget?.id}
              className="px-3 py-1.5 text-xs rounded-full bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50">
              {busyId === rejectTarget?.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Reject product"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{preview?.name}</DialogTitle></DialogHeader>
          {preview && (
            <div className="space-y-3">
              {preview.image_url && (
                <img src={preview.image_url} alt={preview.name} className="w-full rounded-xl" />
              )}
              <div className="text-sm text-muted-foreground whitespace-pre-line">{preview.description}</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <MetaRow label="Designer" value={preview.designer_name || "—"} />
                <MetaRow label="Category" value={preview.category || "—"} />
                <MetaRow label="Material" value={preview.material || "—"} />
                <MetaRow label="Fit" value={preview.fit_type || "—"} />
                <MetaRow label="Price" value={`${preview.currency} ${parseFloat(preview.price).toLocaleString()}`} />
                <MetaRow label="Status" value={preview.moderation_status} />
              </div>
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
    pending_review: "bg-amber-500/10 text-amber-600",
    published: "bg-emerald-500/10 text-emerald-600",
    rejected: "bg-red-500/10 text-red-600",
    draft: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${map[status] || "bg-muted"}`}>
      {status.replace("_", " ")}
    </span>
  );
}
