"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Package, ShoppingCart, Wallet, Plus, Edit3, Trash2, Loader2, Image as ImageIcon, AlertCircle, Send
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MATERIALS } from "@/lib/materials";

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
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [uploadingSlot, setUploadingSlot] = useState<null | "front" | "back" | "side">(null);
  const [uploadError, setUploadError] = useState("");
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const sideRef = useRef<HTMLInputElement>(null);
  const [newProduct, setNewProduct] = useState({
    name: "", description: "", price: "", stock: "1", category: "",
    front_url: "", back_url: "", side_url: "",
    material: "", fit_type: "",
  });
  const [options, setOptions] = useState<{ materials: {value:string,label:string}[], fits: {value:string,label:string}[] }>({ materials: [], fits: [] });
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
    fetch(`${API_BASE}/api/options/`).then(r => r.ok && r.json()).then(d => {
      if (d) setOptions({ materials: d.materials || [], fits: d.fits || [] });
    }).catch(() => {});
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

  const uploadImage = async (file: File, slot: "front" | "back" | "side") => {
    if (!token) return;
    setUploadingSlot(slot);
    setUploadError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(`${API_BASE}/api/upload/`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (r.ok) {
        const d = await r.json();
        setNewProduct((p) => ({ ...p, [`${slot}_url`]: d.url } as typeof p));
      } else {
        const d = await r.json().catch(() => ({}));
        setUploadError(d.error || "Upload failed");
      }
    } catch {
      setUploadError("Upload failed");
    } finally {
      setUploadingSlot(null);
    }
  };

  const onFilePick = (slot: "front" | "back" | "side") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file, slot);
    e.target.value = "";
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
    const imgs: string[] = (p.images || []).map((i: any) => (typeof i === "string" ? i : i?.url)).filter(Boolean);
    setNewProduct({
      name: p.name,
      description: p.description || "",
      price: p.price.toString(),
      stock: p.stock.toString(),
      category: p.category_id?.toString() || "",
      front_url: imgs[0] || p.image_url || "",
      back_url: imgs[1] || "",
      side_url: imgs[2] || "",
      material: p.material || "",
      fit_type: p.fit_type || "",
    });
    setUploadError("");
    setShowForm(true);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setNewProduct({ name: "", description: "", price: "", stock: "1", category: "", front_url: "", back_url: "", side_url: "", material: "", fit_type: "" });
    setFormErrors({});
    setUploadError("");
    setShowForm(true);
  };

  const saveProduct = async () => {
    if (!token || !validate()) return;
    setSaving(true);
    try {
      const url = editingProduct ? `${API_BASE}/api/products/${editingProduct.id}/` : `${API_BASE}/api/products/`;
      const method = editingProduct ? "PUT" : "POST";
      const images = [newProduct.front_url, newProduct.back_url, newProduct.side_url]
        .filter(Boolean)
        .map((u) => ({ url: u }));
      const body = {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        category: parseInt(newProduct.category) || undefined,
        material: newProduct.material,
        fit_type: newProduct.fit_type,
        images,
      };
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        toast.success(editingProduct ? "Product updated" : "Product saved as draft");
        setShowForm(false);
        setEditingProduct(null);
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

  const submitForReview = async (id: number) => {
    if (!token) return;
    setSubmitting(id);
    try {
      const r = await fetch(`${API_BASE}/api/products/${id}/submit/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        toast.success("Sent for review");
        fetchDash();
      } else {
        const d = await r.json().catch(() => ({}));
        toast.error(d.detail || "Failed to submit");
      }
    } catch { toast.error("Failed"); } finally { setSubmitting(null); }
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
              <button onClick={openCreate}
                className="px-4 py-2 rounded-full bg-foreground text-background text-xs font-medium inline-flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add product
              </button>
            </div>

              <Dialog open={showForm} onOpenChange={(o) => { if (!o) { setShowForm(false); setEditingProduct(null); setFormErrors({}); setUploadError(""); } }}>
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

                  <div className="grid grid-cols-2 gap-3">
                    <FieldBlock label="Material" error={formErrors.material}>
                      <select value={newProduct.material} onChange={(e) => setNewProduct({ ...newProduct, material: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border bg-background">
                        <option value="">Select material</option>
                        {MATERIALS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </FieldBlock>
                    <FieldBlock label="Fit type" error={formErrors.fit_type}>
                      <select value={newProduct.fit_type} onChange={(e) => setNewProduct({ ...newProduct, fit_type: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border bg-background">
                        <option value="">Select fit</option>
                        {options.fits.length > 0
                          ? options.fits.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)
                          : (["slim", "regular", "oversized"] as const).map((f) => <option key={f} value={f}>{f[0].toUpperCase() + f.slice(1)}</option>)}
                      </select>
                    </FieldBlock>
                  </div>

                  <FieldBlock label="Product images" error={formErrors.images || uploadError}>
                    <div className="space-y-2">
                      <p className="text-[11px] text-muted-foreground">
                        Front is required. Back and side let our try-on engine see the garment from more angles — better previews mean better conversion.
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {(["front", "back", "side"] as const).map((slot) => {
                          const url = newProduct[`${slot}_url` as const];
                          const ref = slot === "front" ? frontRef : slot === "back" ? backRef : sideRef;
                          const uploading = uploadingSlot === slot;
                          return (
                            <div key={slot}>
                              <input ref={ref} type="file" accept="image/*" onChange={onFilePick(slot)} className="hidden" />
                              {url ? (
                                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-muted">
                                  <img src={url} alt={slot} className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                  <button type="button"
                                    onClick={() => setNewProduct((p) => ({ ...p, [`${slot}_url`]: "" } as typeof p))}
                                    className="absolute top-1 right-1 p-1 rounded-full bg-background/80 backdrop-blur hover:bg-background transition-colors">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                  <span className="absolute bottom-1 left-1 text-[9px] px-1.5 py-0.5 rounded-full bg-background/80 backdrop-blur capitalize">
                                    {slot}
                                  </span>
                                </div>
                              ) : (
                                <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
                                  className="w-full aspect-square rounded-xl border-2 border-dashed border-border hover:border-foreground/40 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground disabled:opacity-60">
                                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                                  <span className="text-[10px] capitalize">{uploading ? "..." : slot}</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </FieldBlock>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700">
                    Saved as a <strong>draft</strong>. Hit <strong>Submit for review</strong> on the product row when you&apos;re ready — admins will approve it before it goes live.
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button onClick={() => { setShowForm(false); setEditingProduct(null); setFormErrors({}); setUploadError(""); }}
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
              <>
                {dash.products.some((p: any) => (p.tryons_window || p.tryons_total || 0) >= 5 && (p.purchases_window || 0) === 0) && (
                  <div className="mb-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
                    <strong>Try-on / purchase ratio</strong> shows how many shoppers virtually tried the piece vs. how many actually bought (past {dash.funnel_window_days || 14} days).
                    Products marked <strong>high try-on, no purchase</strong> are getting attention but stalling at checkout — usually a photo, description, or price signal.
                  </div>
                )}
                <div className="space-y-2">
                {dash.products?.map((p: any) => {
                  const statusColor: Record<string, string> = { draft: "bg-amber-500/10 text-amber-600", pending_review: "bg-blue-500/10 text-blue-600", published: "bg-emerald-500/10 text-emerald-600", rejected: "bg-red-500/10 text-red-600" };
                  const statusLabel: Record<string, string> = { draft: "Draft", pending_review: "Pending", published: "Live", rejected: "Rejected" };
                  const status = p.moderation_status || (p.is_published ? "published" : "draft");
                  const canSubmit = status === "draft" || status === "rejected";
                  const tryons = p.tryons_window ?? p.tryons_total ?? 0;
                  const purchases = p.purchases_window ?? 0;
                  const flagged = tryons >= 5 && purchases === 0;
                  return (
                  <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {p.image_url && <img src={p.image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground">₦{parseFloat(p.price).toLocaleString()}</div>
                        {p.material && <div className="text-[10px] text-muted-foreground/60 capitalize">{p.material} · {p.fit_type || "regular"}</div>}
                      </div>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full shrink-0", statusColor[status] || "bg-muted text-muted-foreground")}>
                        {statusLabel[status] || status}
                      </span>
                      {tryons > 0 && (
                        <span
                          className={cn("text-[10px] shrink-0", flagged ? "text-amber-600 font-medium" : "text-muted-foreground/60")}
                          title={flagged ? "High try-ons but no purchases — worth reviewing the photo or price" : undefined}
                        >
                          {tryons} try-on{tryons === 1 ? "" : "s"} · {purchases} sold
                          {flagged ? " · needs review" : ""}
                        </span>
                      )}
                    </div>
                    {status === "rejected" && p.rejection_reason && (
                      <span className="text-[10px] text-red-500 max-w-[120px] truncate hidden sm:block mr-2" title={p.rejection_reason}>
                        {p.rejection_reason}
                      </span>
                    )}
                    <div className="flex items-center gap-1 shrink-0">
                      {canSubmit && (
                        <button onClick={() => submitForReview(p.id)} disabled={submitting === p.id}
                          title="Submit for admin review"
                          className="p-2 rounded-full hover:bg-blue-500/10 transition-colors disabled:opacity-50">
                          {submitting === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      <button onClick={() => startEdit(p)} className="p-2 rounded-full hover:bg-foreground/5"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteProduct(p.id)} disabled={deleting === p.id}
                        className="p-2 rounded-full hover:bg-red-500/10 transition-colors">
                        {deleting === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );})}
                </div>
              </>
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
