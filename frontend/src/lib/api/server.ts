import { API_BASE, parseProductList, toProduct, type ApiProduct } from "@/lib/api/mapping";

/**
 * Server-side helpers for Next.js API routes that need to read the real
 * marketplace from the Django backend instead of any local mock array.
 * These run on the Node server (never the browser) so there is no auth
 * store / React Query dependency.
 */

export async function serverFetchProducts(query: {
  search?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  designer?: number | string;
  limit?: number;
} = {}): Promise<ApiProduct[]> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.category && query.category !== "all") params.set("category", query.category);
  if (query.min_price != null) params.set("min_price", String(query.min_price));
  if (query.max_price != null) params.set("max_price", String(query.max_price));
  if (query.designer != null) params.set("designer", String(query.designer));
  if (query.limit != null) params.set("limit", String(query.limit));
  const url = `${API_BASE}/api/products/${params.toString() ? `?${params}` : ""}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    return parseProductList(await res.json());
  } catch {
    return [];
  }
}

export async function serverFetchProduct(id: string): Promise<ApiProduct | null> {
  try {
    const res = await fetch(`${API_BASE}/api/products/${id}/`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as ApiProduct;
  } catch {
    return null;
  }
}

export async function serverFetchProductAsFrontend(id: string) {
  const raw = await serverFetchProduct(id);
  return raw ? toProduct(raw) : null;
}
