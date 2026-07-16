"use client";

import { motion } from "framer-motion";
import { User, Package, Ruler, Wallet, LogOut, Shield } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";

const EASE = [0.22, 1, 0.36, 1] as const;

const ACCOUNT_LINKS = [
  { href: "/account/profile/body", label: "Body Measurements", icon: Ruler, description: "Your body profile for fit analysis" },
  { href: "/orders", label: "Order History", icon: Package, description: "View past purchases" },
];

export default function AccountPage() {
  const { token, user, isDesigner, isAdmin, logout } = useAuthStore();

  if (!token) {
    return (
      <section className="min-h-screen pt-28 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center py-20">
          <User className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-lg text-muted-foreground">Sign in to manage your account.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-28 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-medium">Account</h1>
            <p className="text-sm text-muted-foreground">{user?.username || user?.email}</p>
          </div>
        </div>

        <div className="space-y-2">
          {ACCOUNT_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card/50 hover:bg-foreground/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center shrink-0">
                <link.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{link.label}</p>
                <p className="text-xs text-muted-foreground">{link.description}</p>
              </div>
            </Link>
          ))}

          {isDesigner() && (
            <>
              <Link
                href="/account/earnings"
                className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card/50 hover:bg-foreground/5 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Earnings</p>
                  <p className="text-xs text-muted-foreground">Sales, payouts, and revenue</p>
                </div>
              </Link>
              <Link
                href="/account/bank-details"
                className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card/50 hover:bg-foreground/5 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Bank Details</p>
                  <p className="text-xs text-muted-foreground">Payout account information</p>
                </div>
              </Link>
            </>
          )}

          {isAdmin() && (
            <Link
              href="/admin"
              className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card/50 hover:bg-foreground/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Admin Panel</p>
                <p className="text-xs text-muted-foreground">Platform management</p>
              </div>
            </Link>
          )}

          <button
            onClick={logout}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-card/50 hover:bg-destructive/10 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="font-medium text-sm text-destructive">Sign Out</p>
              <p className="text-xs text-muted-foreground">Log out of your account</p>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
