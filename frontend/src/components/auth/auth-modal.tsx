"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Sparkles } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export function AuthModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { setToken, setUser } = useAuthStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        const r = await fetch(`${API_BASE}/api/auth/register/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!r.ok) { const d = await r.json(); throw new Error(Object.values(d).flat().join(", ")); }
        toast.success("Account created! Log in.");
        setMode("login");
        return;
      }
      const r = await fetch(`${API_BASE}/api/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.username, password: form.password }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Invalid credentials");
      setToken(d.access);
      const me = await fetch(`${API_BASE}/api/auth/me/`, {
        headers: { Authorization: `Bearer ${d.access}` },
      });
      if (me.ok) setUser(await me.json());
      toast.success("Logged in!");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-champagne" />
            {mode === "login" ? "Sign in" : "Create account"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="Username" className="w-full px-3 py-2 text-sm rounded-xl border bg-background" />
          {mode === "register" && (
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email" className="w-full px-3 py-2 text-sm rounded-xl border bg-background" />
          )}
          <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Password" className="w-full px-3 py-2 text-sm rounded-xl border bg-background" />
          <button disabled={loading}
            className="w-full py-2.5 rounded-full bg-foreground text-background text-sm font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "login" ? "Sign in" : "Create account"}
          </button>
          <p className="text-xs text-center text-muted-foreground">
            {mode === "login" ? "No account? " : "Have an account? "}
            <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="underline hover:text-foreground">
              {mode === "login" ? "Register" : "Sign in"}
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
