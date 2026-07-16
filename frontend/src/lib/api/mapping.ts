import type { Product, ProductReview, Garment } from "@/lib/types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export interface ProductQuery {
  search?: string;
  category?: string;
  sort?: string;
  min_price?: number;
  max_price?: number;
  designer?: number | string;
}

// --- Raw API shapes (subset of the backend serializers) -------------------
export interface ApiImage {
  url: string;
  alt?: string;
}
export interface ApiColor {
  name: string;
  hex: string;
}
export interface ApiSize {
  label: string;
  inStock: boolean;
}
export interface ApiCategory {
  id: number;
  name: string;
  slug: string;
}
export interface ApiReview {
  id: number;
  user: number;
  username: string;
  rating: number;
  body: string;
  created_at: string;
}
export interface ApiProduct {
  id: number;
  name: string;
  description: string;
  price: string;
  currency: string;
  category: ApiCategory;
  designer_id: number | null;
  designer_name: string;
  image_url: string | null;
  images: ApiImage[];
  colors: ApiColor[];
  sizes: ApiSize[];
  tags: string[];
  featured: boolean;
  material: string;
  fit_type: string;
  ships_from: string;
  ships_within: string;
  returns: string;
  stock: number;
  stock_count: number;
  rating: number;
  reviews?: ApiReview[];
  created_at: string;
}

export function parseProductList(data: unknown): ApiProduct[] {
  if (Array.isArray(data)) return data as ApiProduct[];
  if (data && typeof data === "object" && Array.isArray((data as { results?: ApiProduct[] }).results)) {
    return (data as { results: ApiProduct[] }).results;
  }
  return [];
}

function mapAvailability(stock: number, stockCount: number): Product["availability"] {
  if (stock <= 0) return "sold-out";
  if (stockCount > 0 && stockCount <= 5) return "low-stock";
  return "in-stock";
}

export function toProduct(p: ApiProduct): Product {
  const images: { url: string; alt: string }[] = (p.images || []).map((img) => ({
    url: img.url,
    alt: img.alt || p.name,
  }));
  const primary = p.image_url || images[0]?.url || "";
  const reviews: ProductReview[] = (p.reviews || []).map((r) => ({
    id: String(r.id),
    author: r.username,
    avatar: undefined,
    rating: r.rating,
    title: "",
    body: r.body,
    createdAt: new Date(r.created_at).getTime(),
    verified: false,
    helpful: 0,
  }));
  return {
    id: String(p.id),
    name: p.name,
    sellerName: p.designer_name || "Vesti",
    sellerId: p.designer_id != null ? String(p.designer_id) : "",
    category: (p.category?.slug || "all") as Product["category"],
    price: parseFloat(p.price) || 0,
    currency: p.currency || "NGN",
    description: p.description || "",
    images,
    image: primary,
    colors: p.colors || [],
    sizes: p.sizes || [],
    tags: p.tags || [],
    featured: p.featured,
    availability: mapAvailability(p.stock, p.stock_count),
    stockCount: p.stock_count,
    rating: p.rating || 0,
    reviewCount: reviews.length,
    reviews,
    material: (p.material || undefined) as Product["material"],
    shipsFrom: p.ships_from,
    shipsWithin: p.ships_within,
    returns: p.returns,
  };
}

export function productToGarment(p: Product): Garment {
  return {
    id: p.id,
    name: p.name,
    designer: p.sellerName,
    designerId: p.sellerId,
    category: p.category,
    price: p.price,
    currency: p.currency,
    image: p.images[0]?.url || p.image,
    description: p.description,
    colors: p.colors.map((c) => c.name),
    sizes: p.sizes.map((s) => s.label),
    tags: p.tags,
    featured: p.featured,
    inStock: p.availability !== "sold-out",
    material: p.material,
  };
}
