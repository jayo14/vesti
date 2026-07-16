"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const EASE = [0.22, 1, 0.36, 1] as const;

export default function BankDetailsPage() {
  const { token, isDesigner } = useAuthStore();
  const [form, setForm] = useState({ bank_name: "", account_number: "", account_name: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token || !isDesigner()) return;
    fetch(`${API_BASE}/api/auth/bank-details/`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.ok && r.json()).then(d => {
      if (d && d.bank_name) setForm({ bank_name: d.bank_name || "", account_number: d.account_number || "", account_name: d.account_name || "" });
    }).catch(() => {});
  }, [token, isDesigner]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!form.bank_name.trim() || !form.account_number.trim() || !form.account_name.trim()) {
      toast.error("All fields are required");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE}/api/auth/bank-details/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (r.ok) {
        setSaved(true);
        toast.success("Bank details saved");
      } else {
        const d = await r.json();
        toast.error(d.detail || d.error || "Failed to save");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <section className="min-h-screen pt-28 pb-16">
        <div className="mx-auto max-w-xl px-4 text-center py-20">
          <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-lg text-muted-foreground">Sign in to manage bank details.</p>
        </div>
      </section>
    );
  }

  if (!isDesigner()) {
    return (
      <section className="min-h-screen pt-28 pb-16">
        <div className="mx-auto max-w-xl px-4 text-center py-20">
          <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-lg text-muted-foreground">Only designers need bank details.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-28 pb-16">
      <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
        <Link href="/account" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Account
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
          <h1 className="font-serif text-3xl font-medium mb-2">Bank Details</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Where we&apos;ll send your payouts. Secure and encrypted.
          </p>

          {saved && (
            <div className="flex items-center gap-2 p-3 mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-600">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Saved successfully
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">Bank name</label>
              <input value={form.bank_name} onChange={(e) => { setSaved(false); setForm({ ...form, bank_name: e.target.value }); }}
                placeholder="e.g. Bank of America, First Bank"
                className="w-full px-4 py-3 rounded-xl border border-border bg-card/50 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Account number</label>
              <input value={form.account_number} onChange={(e) => { setSaved(false); setForm({ ...form, account_number: e.target.value }); }}
                placeholder="e.g. 1234567890"
                className="w-full px-4 py-3 rounded-xl border border-border bg-card/50 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Account name</label>
              <input value={form.account_name} onChange={(e) => { setSaved(false); setForm({ ...form, account_name: e.target.value }); }}
                placeholder="Full name on the account"
                className="w-full px-4 py-3 rounded-xl border border-border bg-card/50 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20" />
            </div>

            <button type="submit" disabled={saving}
              className="w-full py-3.5 rounded-full bg-foreground text-background text-sm font-medium inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save bank details
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
