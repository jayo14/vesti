"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Package, ShoppingCart, Wallet, Plus, Edit3, Trash2, Loader2, TrendingUp, Image, AlertCircle, Check
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const EASE = [0.22, 1, 0.36, 1] as const;

export function DesignerDashboardSection() {
  const { token, user, isDesigner } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newProduct, setNewProduct] = useState({ name: "", description: "", price: "", stock: "1", category: "", image_url: "", is_published: false });
  const descRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (showForm) requestAnimationFrame(autoResize);
  }, [showForm, editingProduct]);

  const autoResize = () => {
    const el = descRef.current;
    if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!newProduct.name.trim()) e.name = "Name is required";
    if (!newProduct.price || parseFloat(newProduct.price) <= 0) e.price = "Enter a valid price";
    if (!newProduct.category) e.category = "Select a category";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const deleteProduct = async (id: number) => {
    if (!token) return;
    if (!window.confirm("Delete this product permanently?")) return;
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

  const startEdit = (p: any) => {
    setEditingProduct(p);
    setNewProduct({ name: p.name, description: p.description || "", price: p.price.toString(), stock: p.stock.toString(), category: p.category_id?.toString() || "", image_url: p.image_url || "", is_published: p.is_published });
    setShowForm(true);
  };

  const saveProduct = async () => {
    if (!token || !validate()) return;
    setSaving(true);
    try {
      const url = editingProduct ? `${API_BASE}/api/products/${editingProduct.id}/` : `${API_BASE}/api/products/`;
      const method = editingProduct ? "PUT" : "POST";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newProduct, price: parseFloat(newProduct.price), stock: parseInt(newProduct.stock), category: parseInt(newProduct.category) || undefined }),
      });
      if (r.ok) {
        toast.success(editingProduct ? "Product updated" : "Product added");
        setShowForm(false);
        setEditingProduct(null);
        setNewProduct({ name: "", description: "", price: "", stock: "1", category: "", image_url: "", is_published: false });
        setFormErrors({});
        fetchDash();
      } else {
        const d = await r.json().catch(() => ({}));
        const serverErrors: Record<string, string> = {};
        for (const [k, v] of Object.entries(d)) serverErrors[k] = Array.isArray(v) ? v.join(", ") : String(v);
        if (Object.keys(serverErrors).length) {
          setFormErrors(serverErrors);
          toast.error("Please fix the highlighted fields");
        } else {
          toast.error("Failed to save product");
        }
      }
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
              <button onClick={() => { setShowForm(true); setEditingProduct(null); setNewProduct({ name: "", description: "", price: "", stock: "1", category: "", image_url: "", is_published: false }); setFormErrors({}); }}
                className="px-4 py-2 rounded-full bg-foreground text-background text-xs font-medium inline-flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add product
              </button>
            </div>

            <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditingProduct(null); setFormErrors({}); } }}>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif text-lg">{editingProduct ? "Edit product" : "Add product"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Fields marked <span className="text-foreground font-medium">name</span>, <span className="text-foreground font-medium">category</span> and <span className="text-foreground font-medium">price</span> are required to list your product.</span>
                  </div>
                  <FieldBlock label="Product name" error={formErrors.name}>
                    <input value={newProduct.name} onChange={(e) => { setNewProduct({ ...newProduct, name: e.target.value }); setFormErrors({ ...formErrors, name: "" }); }}
                      placeholder="e.g. Silk Evening Gown" className="w-full px-3 py-2 text-sm rounded-xl border bg-background" />
                  </FieldBlock>

                  <FieldBlock label="Description" error={formErrors.description}>
                    <textarea ref={descRef} value={newProduct.description} onChange={(e) => { setNewProduct({ ...newProduct, description: e.target.value }); autoResize(); }}
                      placeholder="Describe your product..." rows={3}
                      className="w-full px-3 py-2 text-sm rounded-xl border bg-background resize-none" />
                  </FieldBlock>

                  <FieldBlock label="Category" error={formErrors.category}>
                    <select value={newProduct.category} onChange={(e) => { setNewProduct({ ...newProduct, category: e.target.value }); setFormErrors({ ...formErrors, category: "" }); }}
                      className="w-full px-3 py-2 text-sm rounded-xl border bg-background">
                      <option value="">Select category</option>
                      {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </FieldBlock>

                  <div className="grid grid-cols-2 gap-3">
                    <FieldBlock label="Price (NGN)" error={formErrors.price}>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
                        <input type="number" value={newProduct.price} onChange={(e) => { setNewProduct({ ...newProduct, price: e.target.value }); setFormErrors({ ...formErrors, price: "" }); }}
                          placeholder="0.00" className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border bg-background" />
                      </div>
                    </FieldBlock>
                    <FieldBlock label="Stock">
                      <input type="number" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                        placeholder="Qty" className="w-full px-3 py-2 text-sm rounded-xl border bg-background" />
                    </FieldBlock>
                  </div>

                  <FieldBlock label="Image URL">
                    <div className="space-y-2">
                      <input value={newProduct.image_url} onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                        placeholder="https://example.com/image.jpg" className="w-full px-3 py-2 text-sm rounded-xl border bg-background" />
                      {newProduct.image_url && (
                        <div className="relative w-full h-32 rounded-xl overflow-hidden bg-muted">
                          <img src={newProduct.image_url} alt="Preview" className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }}
                            onLoad={(e) => { (e.target as HTMLImageElement).style.display = "block"; (e.target as HTMLImageElement).nextElementSibling?.classList.add("hidden"); }} />
                          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground bg-muted hidden">
                            <Image className="w-5 h-5 mr-1" /> Preview failed
                          </div>
                        </div>
                      )}
                    </div>
                  </FieldBlock>

                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <div className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors", newProduct.is_published ? "bg-foreground border-foreground" : "border-border")}>
                      {newProduct.is_published && <Check className="w-3 h-3 text-background" />}
                    </div>
                    <input type="checkbox" checked={newProduct.is_published} onChange={(e) => setNewProduct({ ...newProduct, is_published: e.target.checked })}
                      className="hidden" />
                    <span className="text-sm">Publish immediately</span>
                  </label>

                  <div className="flex gap-2 pt-2">
                    <button onClick={() => { setShowForm(false); setEditingProduct(null); setFormErrors({}); }}
                      className="flex-1 py-2.5 rounded-full border border-border text-sm font-medium hover:bg-foreground/5 transition-colors">
                      Cancel
                    </button>
                    <button onClick={saveProduct} disabled={saving}
                      className="flex-1 py-2.5 rounded-full bg-foreground text-background text-sm font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2">
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editingProduct ? "Update" : "Save product"}
                    </button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {dash.products?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No products yet. Add your first one!</p>
            ) : (
              <div className="space-y-2">
                {dash.products?.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/40">
                    <div className="flex items-center gap-2">
                      {p.image_url && <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                      <div>
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">₦{parseFloat(p.price).toLocaleString()}</div>
                      </div>
                      {p.is_published !== undefined && (
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", p.is_published ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600")}>
                          {p.is_published ? "Live" : "Draft"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(p)} className="p-2 rounded-full hover:bg-foreground/5"><Edit3 className="w-3.5 h-3.5" /></button>
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
                    <div key={o.id} className="p-4 rounded-2xl bg-muted/40">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Order #{o.id}</span>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full", {
                          "bg-amber-500/10 text-amber-600": o.status === "pending",
                          "bg-emerald-500/10 text-emerald-600": o.status === "paid",
                        })}>{o.status}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">₦{parseFloat(o.total || "0").toLocaleString()}</div>
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

function FieldBlock({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</span>
      {children}
      {error && <span className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</span>}
    </label>
  );
}
