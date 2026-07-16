"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, ArrowLeft, Plus, Trash2, Check } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const EASE = [0.22, 1, 0.36, 1] as const;

interface PayoutMethod {
  id: number;
  bank_name: string;
  bank_account_number: string;
  bank_account_name: string;
  is_default: boolean;
}

export default function BankDetailsPage() {
  const { token, isDesigner } = useAuthStore();
  const [methods, setMethods] = useState<PayoutMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [form, setForm] = useState({ bank_name: "", bank_account_number: "", bank_account_name: "", is_default: false });

  const authed = !!token && isDesigner();

  const fetchMethods = async () => {
    if (!authed) { setLoading(false); return; }
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/payout-methods/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const data = await r.json();
        setMethods(Array.isArray(data) ? data : data.results || []);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchMethods(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [token]);

  const addMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!form.bank_name.trim() || !form.bank_account_number.trim() || !form.bank_account_name.trim()) {
      toast.error("All fields are required");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE}/api/payout-methods/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (r.ok) {
        toast.success("Bank account added");
        setAdding(false);
        setForm({ bank_name: "", bank_account_number: "", bank_account_name: "", is_default: false });
        fetchMethods();
      } else {
        const d = await r.json().catch(() => ({}));
        toast.error(d.detail || "Failed to add");
      }
    } catch { toast.error("Something went wrong"); } finally { setSaving(false); }
  };

  const setDefault = async (id: number) => {
    if (!token) return;
    setBusyId(id);
    try {
      const r = await fetch(`${API_BASE}/api/payout-methods/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_default: true }),
      });
      if (r.ok) { toast.success("Default updated"); fetchMethods(); }
      else toast.error("Failed to update");
    } catch { toast.error("Something went wrong"); } finally { setBusyId(null); }
  };

  const removeMethod = async (id: number) => {
    if (!token) return;
    if (!confirm("Remove this bank account?")) return;
    setBusyId(id);
    try {
      const r = await fetch(`${API_BASE}/api/payout-methods/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok || r.status === 204) { toast.success("Removed"); fetchMethods(); }
      else toast.error("Failed to remove");
    } catch { toast.error("Something went wrong"); } finally { setBusyId(null); }
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
            Payouts land in your default account. Add as many as you want.
          </p>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              <div className="space-y-2 mb-6">
                {methods.length === 0 && !adding && (
                  <p className="text-sm text-muted-foreground py-6 text-center">No bank accounts yet</p>
                )}
                {methods.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card/50">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{m.bank_account_name}</div>
                      <div className="text-xs text-muted-foreground truncate">{m.bank_name} · {m.bank_account_number}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {m.is_default ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-champagne/20 text-champagne font-medium">Default</span>
                      ) : (
                        <button onClick={() => setDefault(m.id)} disabled={busyId === m.id}
                          title="Set as default"
                          className="p-2 rounded-full hover:bg-foreground/5 transition-colors disabled:opacity-50">
                          {busyId === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      <button onClick={() => removeMethod(m.id)} disabled={busyId === m.id}
                        className="p-2 rounded-full hover:bg-red-500/10 transition-colors disabled:opacity-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {adding ? (
                <form onSubmit={addMethod} className="space-y-3 p-4 rounded-2xl border border-border bg-card/50">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Bank name</label>
                    <input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                      placeholder="e.g. First Bank"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Account number</label>
                    <input value={form.bank_account_number} onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
                      placeholder="10-digit account number"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Account name</label>
                    <input value={form.bank_account_name} onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })}
                      placeholder="Full name on the account"
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
                    Set as default payout account
                  </label>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => setAdding(false)}
                      className="flex-1 py-2 rounded-full border border-border text-sm font-medium hover:bg-foreground/5">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving}
                      className="flex-1 py-2 rounded-full bg-foreground text-background text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50">
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
                    </button>
                  </div>
                </form>
              ) : (
                <button onClick={() => setAdding(true)}
                  className="w-full py-3 rounded-full border-2 border-dashed border-border hover:border-foreground/40 text-sm font-medium text-muted-foreground inline-flex items-center justify-center gap-2 transition-colors">
                  <Plus className="w-4 h-4" /> Add bank account
                </button>
              )}
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}
