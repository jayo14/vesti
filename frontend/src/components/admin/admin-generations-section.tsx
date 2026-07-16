"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, AlertTriangle, Clock, Flag, ImageIcon, Expand } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { AdminAIHealth, AdminGeneration } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

const REASON_LABELS: Record<string, string> = {
  no_person_detected: "No person detected",
  multiple_people: "Multiple people in frame",
  low_pose_confidence: "Low pose confidence",
  segmentation_failed: "Garment segmentation failed",
  model_unavailable: "Model unavailable",
  model_timeout: "Model timeout",
  pipeline_unreachable: "Vision pipeline unreachable",
  empty_result: "Empty result from pipeline",
  unknown: "Unknown",
};

export function AdminGenerationsSection() {
  const token = useAuthStore((s) => s.token);
  const [tab, setTab] = useState<"health" | "gallery">("health");
  const [days, setDays] = useState<7 | 30 | 90>(7);
  const [health, setHealth] = useState<AdminAIHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [gallery, setGallery] = useState<AdminGeneration[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [flaggedFilter, setFlaggedFilter] = useState<"all" | "flagged" | "unflagged">("all");
  const [flipping, setFlipping] = useState<number | null>(null);
  const [preview, setPreview] = useState<AdminGeneration | null>(null);

  useEffect(() => {
    if (!token || tab !== "health") return;
    setLoading(true);
    fetch(`${API_BASE}/api/admin/ai-health/?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then(setHealth)
      .catch(() => toast.error("Failed to load AI health"))
      .finally(() => setLoading(false));
  }, [token, days, tab]);

  const fetchGallery = async () => {
    if (!token) return;
    setGalleryLoading(true);
    try {
      const flagParam = flaggedFilter === "all" ? "" : `&flagged=${flaggedFilter === "flagged"}`;
      const r = await fetch(`${API_BASE}/api/admin/generations/?limit=50${flagParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setGallery(await r.json());
      else toast.error("Failed to load gallery");
    } catch {
      toast.error("Failed to load gallery");
    } finally {
      setGalleryLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "gallery") fetchGallery();
  }, [token, tab, flaggedFilter]);

  const toggleFlag = async (id: number) => {
    if (!token) return;
    setFlipping(id);
    try {
      const r = await fetch(`${API_BASE}/api/admin/generations/${id}/flag/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const data = await r.json();
        setGallery((prev) =>
          prev.map((g) => (g.id === id ? { ...g, flagged: data.flagged } : g)),
        );
        if (preview?.id === id) setPreview((p) => p ? { ...p, flagged: data.flagged } : p);
        toast.success(data.flagged ? "Flagged for review" : "Flag removed");
      } else {
        toast.error("Failed to toggle flag");
      }
    } catch {
      toast.error("Failed to toggle flag");
    } finally {
      setFlipping(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button onClick={() => setTab("health")}
          className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
            tab === "health" ? "bg-foreground text-background" : "bg-muted/60 text-muted-foreground hover:text-foreground"
          }`}>
          AI Health
        </button>
        <button onClick={() => setTab("gallery")}
          className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
            tab === "gallery" ? "bg-foreground text-background" : "bg-muted/60 text-muted-foreground hover:text-foreground"
          }`}>
          Spot-check gallery
        </button>
      </div>

      {tab === "health" && (
        <>
          <div className="flex items-center gap-2">
            {([7, 30, 90] as const).map((d) => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                  days === d ? "bg-foreground text-background" : "bg-muted/60 text-muted-foreground hover:text-foreground"
                }`}>
                Last {d} days
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !health ? null : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard icon={Sparkles} label="Try-ons" value={health.totals.generations} />
                <StatCard icon={Sparkles} label="Success rate" value={`${health.totals.success_rate}%`} accent="text-emerald-500" />
                <StatCard icon={AlertTriangle} label="Failures" value={health.totals.failed} accent="text-red-500" />
                <StatCard icon={Clock} label="Avg latency" value={`${health.latency_ms.avg} ms`} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-muted/40 border border-border p-5">
                  <h3 className="font-serif text-lg font-medium mb-4">Failures by reason</h3>
                  {health.failures_by_reason.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No failures in this window.</p>
                  ) : (
                    <div className="space-y-2">
                      {health.failures_by_reason.map((row) => {
                        const pct = health.totals.failed > 0 ? (row.count / health.totals.failed) * 100 : 0;
                        return (
                          <div key={row.reason}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>{REASON_LABELS[row.reason] || row.reason}</span>
                              <span className="text-muted-foreground">{row.count}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-background overflow-hidden">
                              <div className="h-full bg-red-500/80" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl bg-muted/40 border border-border p-5">
                  <h3 className="font-serif text-lg font-medium mb-4">Latency (completed)</h3>
                  <div className="space-y-3 text-sm">
                    <Row label="Average" value={`${health.latency_ms.avg} ms`} />
                    <Row label="Fastest" value={`${health.latency_ms.fastest} ms`} />
                    <Row label="Slowest" value={`${health.latency_ms.slowest} ms`} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-muted/40 border border-border overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="font-serif text-lg font-medium">Recent failures</h3>
                </div>
                {health.recent_failures.length === 0 ? (
                  <div className="p-5 text-sm text-muted-foreground">No recent failures.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-background/60 text-xs text-muted-foreground">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium">Time</th>
                          <th className="text-left px-4 py-2 font-medium">User</th>
                          <th className="text-left px-4 py-2 font-medium">Product</th>
                          <th className="text-left px-4 py-2 font-medium">Reason</th>
                          <th className="text-left px-4 py-2 font-medium">Model</th>
                          <th className="text-right px-4 py-2 font-medium">Latency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {health.recent_failures.map((f) => (
                          <tr key={f.id} className="border-t border-border">
                            <td className="px-4 py-2 whitespace-nowrap text-xs">{new Date(f.created_at).toLocaleString()}</td>
                            <td className="px-4 py-2">{f.user_username}</td>
                            <td className="px-4 py-2 text-muted-foreground">{f.product_name || "—"}</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[11px]">
                                {REASON_LABELS[f.failure_reason] || f.failure_reason}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-xs text-muted-foreground">{f.model || "—"}</td>
                            <td className="px-4 py-2 text-right text-xs">{f.latency_ms ? `${f.latency_ms} ms` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {tab === "gallery" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {(["all", "flagged", "unflagged"] as const).map((f) => (
              <button key={f} onClick={() => setFlaggedFilter(f)}
                className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                  flaggedFilter === f ? "bg-foreground text-background" : "bg-muted/60 text-muted-foreground hover:text-foreground"
                }`}>
                {f === "flagged" ? "Flagged" : f === "unflagged" ? "Clean" : "All"}
              </button>
            ))}
          </div>

          {galleryLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : gallery.length === 0 ? (
            <div className="text-sm text-muted-foreground py-16 text-center flex flex-col items-center gap-2">
              <ImageIcon className="w-8 h-8 opacity-40" />
              No generations to review.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {gallery.map((gen) => (
                <div key={gen.id}
                  className={cn(
                    "rounded-2xl bg-muted/40 border overflow-hidden group relative",
                    gen.flagged ? "border-red-500/40 ring-1 ring-red-500/20" : "border-border",
                  )}>
                  <button onClick={() => setPreview(gen)} className="w-full aspect-[3/4] bg-muted flex items-center justify-center overflow-hidden relative">
                    {gen.result_image ? (
                      <img src={gen.result_image} alt="Generation"
                        className="w-full h-full object-cover" />
                    ) : gen.person_image ? (
                      <img src={gen.person_image} alt="Input"
                        className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Expand className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                  <div className="p-2 space-y-1">
                    <div className="text-[10px] text-muted-foreground truncate">
                      {gen.user_username}{gen.product_name ? ` · ${gen.product_name}` : ""}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                        gen.status === "completed" ? "bg-emerald-500/10 text-emerald-600" :
                        gen.status === "failed" ? "bg-red-500/10 text-red-600" :
                        "bg-amber-500/10 text-amber-600",
                      )}>
                        {gen.status}
                      </span>
                      <button onClick={() => toggleFlag(gen.id)} disabled={flipping === gen.id}
                        className={cn(
                          "p-1 rounded-full transition-colors",
                          gen.flagged
                            ? "text-red-500 bg-red-500/10"
                            : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground",
                        )}>
                        {flipping === gen.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Flag className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  {gen.flagged && (
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-medium">
                      Flagged
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Generation #{preview?.id}
              {preview?.flagged && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-medium">Flagged</span>
              )}
            </DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Person</div>
                  <div className="aspect-[3/4] rounded-xl bg-muted overflow-hidden">
                    {preview.person_image ? (
                      <img src={preview.person_image} alt="Person" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-6 h-6" /></div>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Garment</div>
                  <div className="aspect-[3/4] rounded-xl bg-muted overflow-hidden">
                    {preview.garment_image ? (
                      <img src={preview.garment_image} alt="Garment" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-6 h-6" /></div>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Result</div>
                  <div className="aspect-[3/4] rounded-xl bg-muted overflow-hidden relative">
                    {preview.result_image ? (
                      <img src={preview.result_image} alt="Result" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-6 h-6" /></div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <MetaRow label="User" value={preview.user_username} />
                <MetaRow label="Product" value={preview.product_name || "—"} />
                <MetaRow label="Status" value={preview.status} />
                <MetaRow label="Latency" value={preview.latency_ms ? `${preview.latency_ms} ms` : "—"} />
                <MetaRow label="Model" value={preview.model || "—"} />
                <MetaRow label="Fit confidence" value={preview.fit_confidence ? `${(preview.fit_confidence * 100).toFixed(0)}%` : "—"} />
              </div>
              <div className="flex items-center justify-end">
                <button onClick={() => toggleFlag(preview.id)} disabled={flipping === preview.id}
                  className={cn(
                    "inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full font-medium transition-colors",
                    preview.flagged
                      ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}>
                  {flipping === preview.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Flag className="w-3 h-3" />}
                  {preview.flagged ? "Remove flag" : "Flag as inappropriate"}
                </button>
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

function StatCard({ icon: Icon, label, value, accent }: {
  icon: typeof Sparkles; label: string; value: number | string; accent?: string;
}) {
  return (
    <div className="rounded-2xl bg-muted/40 border border-border p-4">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3.5 h-3.5 ${accent || "text-muted-foreground"}`} />
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-serif">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-serif">{value}</span>
    </div>
  );
}
