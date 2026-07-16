"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  user: {
    id: number;
    username: string;
    email: string;
    is_designer: boolean;
    is_staff: boolean;
    is_superuser: boolean;
  } | null;
  setToken: (token: string | null) => void;
  setUser: (user: AuthState["user"]) => void;
  logout: () => void;
  isDesigner: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
      isDesigner: () => get().user?.is_designer ?? false,
      isAdmin: () => get().user?.is_staff ?? false,
    }),
    { name: "vesti-auth" }
  )
);
