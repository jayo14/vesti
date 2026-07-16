"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";
import type { AdminAIHealth } from "@/lib/types";

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
  const [days, setDays] = useState<7 | 30 | 90>(7);
  const [health, setHealth] = useState<AdminAIHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_BASE}/api/admin/ai-health/?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then(setHealth)
      .catch(() => toast.error("Failed to load AI health"))
      .finally(() => setLoading(false));
  }, [token, days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!health) return null;

  return (
    <div className="space-y-6">
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
