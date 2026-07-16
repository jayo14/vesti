"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Users, Search, Shield, Palette, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

interface AdminUser {
  id: number;
  username: string;
  email: string;
  bio: string;
  avatar: string;
  is_designer: boolean;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
  phone: string;
}

export function AdminUsersSection() {
  const token = useAuthStore((s) => s.token);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/auth/users/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setUsers(await r.json());
      else toast.error("Failed to load users");
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [token]);

  const toggleRole = async (userId: number, field: "is_designer" | "is_staff") => {
    if (!token) return;
    setUpdatingId(userId);
    const current = users.find((u) => u.id === userId);
    try {
      const r = await fetch(`${API_BASE}/api/auth/users/${userId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [field]: !current?.[field] }),
      });
      if (r.ok) fetchUsers();
      else toast.error((await r.json()).detail || "Failed");
    } catch {
      toast.error("Failed to update user");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-48 pl-8 pr-3 py-1.5 text-xs rounded-full border border-border bg-background"
            placeholder="Search users..." />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground py-16 text-center flex flex-col items-center gap-2">
          <Users className="w-8 h-8 opacity-40" />
          No users found.
        </div>
      ) : (
        <div className="rounded-2xl bg-muted/40 border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background/60 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">User</th>
                  <th className="text-left px-4 py-2 font-medium">Joined</th>
                  <th className="text-left px-4 py-2 font-medium">Designer</th>
                  <th className="text-left px-4 py-2 font-medium">Staff</th>
                  <th className="text-left px-4 py-2 font-medium">Active</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t border-border hover:bg-background/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium overflow-hidden">
                          {u.avatar ? (
                            <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            u.username[0].toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{u.username}</div>
                          {u.email && <div className="text-[11px] text-muted-foreground">{u.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(u.date_joined).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleRole(u.id, "is_designer")} disabled={updatingId === u.id}
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-full font-medium transition-colors",
                          u.is_designer
                            ? "bg-champagne/20 text-champagne"
                            : "bg-muted text-muted-foreground hover:text-foreground",
                        )}>
                        {updatingId === u.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Palette className="w-3 h-3" />
                        )}
                        {u.is_designer ? "Designer" : "User"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleRole(u.id, "is_staff")} disabled={updatingId === u.id}
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-full font-medium transition-colors",
                          u.is_staff
                            ? "bg-blue-500/20 text-blue-500"
                            : "bg-muted text-muted-foreground hover:text-foreground",
                        )}>
                        {updatingId === u.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Shield className="w-3 h-3" />
                        )}
                        {u.is_staff ? "Staff" : "—"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-full font-medium",
                        u.is_active
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-red-500/10 text-red-600",
                      )}>
                        <UserCheck className="w-3 h-3" />
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
