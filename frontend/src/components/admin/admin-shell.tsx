"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutGrid, UserPlus, Package, Sparkles, Receipt, ArrowUpRight,
  AlertTriangle, Users as UsersIcon, Loader2,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

const NAV = [
  { path: "/admin", label: "Overview", icon: LayoutGrid, exact: true },
  { path: "/admin/designers", label: "Designer apps", icon: UserPlus },
  { path: "/admin/products", label: "Product moderation", icon: Package },
  { path: "/admin/generations", label: "AI health", icon: Sparkles },
  { path: "/admin/transactions", label: "Transactions", icon: Receipt },
  { path: "/admin/payouts", label: "Payouts", icon: ArrowUpRight },
  { path: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
  { path: "/admin/users", label: "Users", icon: UsersIcon },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function AdminShell({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { token, user, loading, fetchUser, isAdmin } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (token && !user) fetchUser();
  }, [token, user, fetchUser]);

  useEffect(() => {
    if (!loading && !token) router.replace("/");
    else if (!loading && user && !isAdmin()) router.replace("/");
  }, [token, user, loading, router, isAdmin]);

  if (loading || !user) {
    return (
      <section className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </section>
    );
  }
  if (!isAdmin()) return null;

  return (
    <section className="relative min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }} className="mb-8">
          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-[-0.02em]">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
            {NAV.map((item) => {
              const active = item.exact
                ? pathname === item.path
                : pathname === item.path || pathname.startsWith(item.path + "/");
              return (
                <Link key={item.path} href={item.path}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl text-sm whitespace-nowrap transition-colors",
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
                  )}>
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div>{children}</div>
        </div>
      </div>
    </section>
  );
}
