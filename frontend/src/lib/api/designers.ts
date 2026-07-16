"use client";

import { useQuery } from "@tanstack/react-query";
import type { Designer } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

interface ApiDesigner {
  id: number;
  username: string;
  bio: string;
  avatar: string;
  is_designer: boolean;
  tagline?: string;
  location?: string;
  specialties: string[];
  collection_count: number;
  product_count: number;
  rating: number;
}

function toDesigner(d: ApiDesigner): Designer {
  return {
    id: String(d.id),
    name: d.username,
    tagline: d.tagline || "",
    bio: d.bio || "",
    avatar: d.avatar || "",
    // No dedicated cover image yet — reuse the avatar for now.
    coverImage: d.avatar || "",
    location: d.location || "",
    specialties: d.specialties || [],
    collectionCount: d.collection_count || d.product_count || 0,
    rating: d.rating || 0,
    verified: d.is_designer,
  };
}

async function fetchDesigners(): Promise<Designer[]> {
  const res = await fetch(`${API_BASE}/api/designers/`);
  if (!res.ok) throw new Error("Failed to load designers");
  const data = await res.json();
  const results: ApiDesigner[] = Array.isArray(data) ? data : data.results || [];
  return results.map(toDesigner);
}

async function fetchDesigner(id: string): Promise<Designer | null> {
  const res = await fetch(`${API_BASE}/api/designers/${id}/`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load designer");
  return toDesigner(await res.json());
}

export function useDesigners() {
  return useQuery({
    queryKey: ["designers"],
    queryFn: fetchDesigners,
    staleTime: 1000 * 60 * 60,
  });
}

export function useDesigner(id: string | null) {
  return useQuery({
    queryKey: ["designer", id],
    queryFn: () => fetchDesigner(id!),
    enabled: !!id,
  });
}

export const designerApi = { fetchDesigners, fetchDesigner };
