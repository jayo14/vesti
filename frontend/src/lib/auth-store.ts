"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

interface UserData {
  id: number;
  username: string;
  email: string;
  is_designer: boolean;
  is_staff: boolean;
  is_superuser: boolean;
}

interface AuthState {
  token: string | null;
  user: UserData | null;
  loading: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: UserData | null) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
  isDesigner: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      loading: false,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
      fetchUser: async () => {
        const { token } = get();
        if (!token) return;
        set({ loading: true });
        try {
          const r = await fetch(`${API_BASE}/api/auth/me/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (r.ok) set({ user: await r.json() });
          else set({ token: null, user: null });
        } catch { set({ token: null, user: null }); }
        finally { set({ loading: false }); }
      },
      isDesigner: () => get().user?.is_designer ?? false,
      isAdmin: () => get().user?.is_staff ?? false,
    }),
    { name: "vesti-auth", partialize: (s) => ({ token: s.token, user: s.user }) }
  )
);
