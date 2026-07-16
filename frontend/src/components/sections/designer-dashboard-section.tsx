"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Package, ShoppingCart, Wallet, Plus, Edit3, Trash2, Loader2, TrendingUp
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const EASE = [0.22, 1, 0.36, 1] as const;

export function DesignerDashboardSection() {
  const { token, user, isDesigner } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [newProduct, setNewProduct] = useState({ name: "", description: "", price: "", stock: "1", category: "" });

  const fetchDash = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const h = { Authorization: `Bearer ${token}` };
      const r = await fetch(`${API_BASE}/api/auth/dashboard/`, { headers: h });
      if (r.ok) setDash(await r.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchDash(); }, [token]);

  useEffect(() => {
    fetch(`${API_BASE}/api/categories/`).then(r => r.ok && r.json()).then(d => setCategories(d.results || d || [])).catch(() => {});
  }, []);

  const deleteProduct = async (id: number) => {
    if (!token) return;
    setDeleting(id);
    try {
      const r = await fetch(`${API_BASE}/api/products/${id}/`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok || r.status === 204) {
        toast.success("Deleted");
        fetchDash();
      } else toast.error("Failed to delete");
    } catch { toast.error("Failed"); }
    finally { setDeleting(null); }
  };

  const addProduct = async () => {
    if (!token || !newProduct.name || !newProduct.price) return;
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE}/api/products/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newProduct, price: parseFloat(newProduct.price), stock: parseInt(newProduct.stock), category: parseInt(newProduct.category) || undefined }),
      });
      if (r.ok) {
        toast.success("Product added");
        setShowForm(false);
        setNewProduct({ name: "", description: "", price: "", stock: "1" });
        fetchDash();
      } else { const d = await r.json(); toast.error(Object.values(d).flat().join(", ")); }
    } catch { toast.error("Failed"); } finally { setSaving(false); }
  };

  if (!isDesigner()) {
    return (
      <section className="pt-24 pb-20 text-center">
        <p className="text-muted-foreground">Become a designer to access this dashboard.</p>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="mb-8">
          <h2 className="font-serif text-4xl sm:text-5xl font-medium">Designer Dashboard</h2>
          <p className="mt-2 text-muted-foreground">Manage your products and track sales</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : dash ? (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Products", value: dash.products_count, icon: Package, color: "text-champagne" },
                { label: "Orders", value: dash.orders_count, icon: ShoppingCart, color: "text-blue-500" },
                { label: "Balance", value: `₦${parseFloat(dash.available_balance || "0").toLocaleString()}`, icon: Wallet, color: "text-emerald-500" },
              ].map((c) => (
                <div key={c.label} className="p-5 rounded-2xl bg-muted/40 border">
                  <div className="flex items-center gap-2 mb-2">
                    <c.icon className={cn("w-4 h-4", c.color)} />
                    <span className="text-xs text-muted-foreground">{c.label}</span>
                  </div>
                  <div className="text-2xl font-serif font-medium">{c.value}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg">My Products</h3>
              <button onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 rounded-full bg-foreground text-background text-xs font-medium inline-flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add product
              </button>
            </div>

            {showForm && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl bg-muted/40 border mb-4 space-y-2">
                <input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Product name" className="w-full px-3 py-2 text-sm rounded-xl border bg-background" />
                <input value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Description" className="w-full px-3 py-2 text-sm rounded-xl border bg-background" />
                <select value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border bg-background">
                  <option value="">Select category</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <input type="number" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    placeholder="Price (USD)" className="flex-1 px-3 py-2 text-sm rounded-xl border bg-background" />
                  <input type="number" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    placeholder="Stock" className="w-24 px-3 py-2 text-sm rounded-xl border bg-background" />
                </div>
                <button onClick={addProduct} disabled={saving}
                  className="w-full py-2 rounded-full bg-foreground text-background text-sm font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save product
                </button>
              </motion.div>
            )}

            {dash.products?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No products yet. Add your first one!</p>
            ) : (
              <div className="space-y-2">
                {dash.products?.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/40">
                    <div>
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">${parseFloat(p.price).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-2 rounded-full hover:bg-foreground/5"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteProduct(p.id)} disabled={deleting === p.id}
                        className="p-2 rounded-full hover:bg-red-500/10 transition-colors">
                        {deleting === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {dash.recent_orders?.length > 0 && (
              <>
                <h3 className="font-serif text-lg mt-8 mb-4">Recent Orders</h3>
                <div className="space-y-2">
                  {dash.recent_orders.map((o: any) => (
                    <div key={o.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/40">
                      <span className="text-sm font-medium">Order #{o.id}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full", {
                        "bg-amber-500/10 text-amber-600": o.status === "pending",
                        "bg-emerald-500/10 text-emerald-600": o.status === "paid",
                      })}>{o.status}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
