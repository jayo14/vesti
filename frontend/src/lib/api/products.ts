"use client";

import { useQuery } from "@tanstack/react-query";
import type { Product } from "@/lib/types";
import {
  API_BASE,
  type ApiProduct,
  type ApiCategory,
  type ProductQuery,
  toProduct,
  parseProductList,
  productToGarment,
} from "@/lib/api/mapping";

export type { ProductQuery } from "@/lib/api/mapping";

async function authHeaders(): Promise<HeadersInit> {
  const { useAuthStore } = await import("@/lib/auth-store");
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchProducts(query: ProductQuery = {}): Promise<Product[]> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.category && query.category !== "all") params.set("category", query.category);
  if (query.sort) params.set("sort", query.sort);
  if (query.min_price != null) params.set("min_price", String(query.min_price));
  if (query.max_price != null) params.set("max_price", String(query.max_price));
  if (query.designer != null) params.set("designer", String(query.designer));
  const url = `${API_BASE}/api/products/${params.toString() ? `?${params}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load products");
  const data = await res.json();
  return parseProductList(data).map(toProduct);
}

async function fetchProduct(id: string): Promise<Product | null> {
  const res = await fetch(`${API_BASE}/api/products/${id}/`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load product");
  return toProduct(await res.json());
}

async function fetchCategories(): Promise<ApiCategory[]> {
  const res = await fetch(`${API_BASE}/api/categories/`);
  if (!res.ok) throw new Error("Failed to load categories");
  const data = await res.json();
  return Array.isArray(data) ? data : data.results || [];
}

// --- React Query hooks ---------------------------------------------------
export function useProducts(query: ProductQuery = {}) {
  return useQuery({
    queryKey: ["products", query],
    queryFn: () => fetchProducts(query),
  });
}

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id!),
    enabled: !!id,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 60,
  });
}

export const productApi = { fetchProducts, fetchProduct, fetchCategories };
