"use client";

import { motion } from "framer-motion";
import { Package, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function OrdersPage() {
  const { token } = useAuthStore();

  if (!token) {
    return (
      <section className="min-h-screen pt-28 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center py-20">
          <Package className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-lg text-muted-foreground">Sign in to view your orders.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-28 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-10">
          <Link href="/account" className="p-2 rounded-full hover:bg-foreground/5 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Package className="w-6 h-6" />
          <h1 className="text-3xl font-serif font-medium">Order History</h1>
        </div>
        <div className="text-center py-20 text-muted-foreground">
          <p>No orders yet.</p>
        </div>
      </div>
    </section>
  );
}
