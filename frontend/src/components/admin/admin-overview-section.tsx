"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  DollarSign, Clock, TrendingUp, Users, Sparkles, Package,
  UserPlus, AlertTriangle, ArrowUpRight, ArrowRight, Loader2,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { AdminDashboardSummary } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

const money = (v: string | number) => `₦${Number(v || 0).toLocaleString()}`;

export function AdminOverviewSection() {
  const token = useAuthStore((s) => s.token);
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_BASE}/api/admin/dashboard/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then(setSummary)
      .catch(() => toast.error("Failed to load overview"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!summary) return null;

  const queues = summary.queues;
  const ai = summary.ai_health_7d;
  const growth = summary.growth;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          href="/admin/designers"
          title="Queues"
          icon={UserPlus}
          accent="text-amber-500"
        >
          <QueueRow label="Designer applications" value={queues?.pending_designer_applications ?? 0} />
          <QueueRow label="Product reviews" value={queues?.pending_product_reviews ?? 0} />
          <QueueRow label="Open disputes" value={queues?.open_disputes ?? 0} />
          <QueueRow label="Pending payouts" value={queues?.pending_payouts ?? summary.pending_payout_count} />
        </Card>

        <Card
          href="/admin/generations"
          title="AI health (7d)"
          icon={Sparkles}
          accent="text-emerald-500"
        >
          <QueueRow label="Try-ons" value={ai?.generations ?? 0} />
          <QueueRow label="Success rate" value={`${ai?.success_rate ?? 0}%`} />
          <QueueRow label="Failures" value={ai?.failed ?? 0} />
          <QueueRow label="Avg latency" value={`${ai?.avg_latency_ms ?? 0} ms`} />
        </Card>

        <Card
          href="/admin/transactions"
          title="Money"
          icon={DollarSign}
          accent="text-champagne"
        >
          <QueueRow label="Total revenue" value={money(summary.total_revenue)} />
          <QueueRow label="Platform commission" value={money(summary.total_commission)} />
          <QueueRow label="Paid transactions" value={summary.paid_transactions} />
          <QueueRow label="Pending payouts value" value={money(summary.pending_payouts)} />
        </Card>

        <Card
          href="/admin/users"
          title="Growth (30d)"
          icon={TrendingUp}
          accent="text-blue-500"
        >
          <QueueRow label="New users" value={growth?.new_users_30d ?? 0} />
          <QueueRow label="New users (7d)" value={growth?.new_users_7d ?? 0} />
          <QueueRow label="New designers" value={growth?.new_designers_30d ?? 0} />
          <QueueRow label="New products" value={growth?.new_products_30d ?? 0} />
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat icon={Package} label="Products moderated" value={queues?.pending_product_reviews ?? 0} />
        <MiniStat icon={Users} label="Active designers" value={summary.total_designers} />
        <MiniStat icon={ArrowUpRight} label="Payouts pending" value={queues?.pending_payouts ?? summary.pending_payout_count} />
        <MiniStat icon={AlertTriangle} label="Open disputes" value={queues?.open_disputes ?? 0} />
      </div>
    </div>
  );
}

function Card({
  href, title, icon: Icon, accent, children,
}: {
  href: string;
  title: string;
  icon: typeof DollarSign;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="block group rounded-2xl bg-muted/40 border border-border p-5 hover:bg-muted/60 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", accent)} />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">{title}</span>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
      </div>
      <div className="space-y-1.5">{children}</div>
    </Link>
  );
}

function QueueRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-serif font-medium">{value}</span>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-muted/40 border border-border p-4">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-serif">{value}</div>
    </div>
  );
}
