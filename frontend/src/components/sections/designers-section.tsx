"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, MapPin, Sparkles, ArrowRight, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStudioStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { useDesigners } from "@/lib/api/designers";
import { useProducts } from "@/lib/api/products";
import type { Designer, Product, Garment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

const EASE = [0.22, 1, 0.36, 1] as const;

function productToGarment(p: Product): Garment {
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

export function DesignersSection() {
  const router = useRouter();
  const { setSelectedGarment, setCustomGarmentImage, setGarmentSource } = useStudioStore();
  const { token, isDesigner } = useAuthStore();
  const { data: designers = [], isLoading } = useDesigners();

  const handleBecomeDesigner = async () => {
    if (!token) { toast.error("Sign in first"); return; }
    router.push("/become-designer");
  };

  const handleTryOnProduct = (p: Product) => {
    setSelectedGarment(productToGarment(p));
    setCustomGarmentImage(null);
    setGarmentSource("designer");
    router.push("/try-on");
  };

  return (
    <section className="relative min-h-screen pt-24 pb-20">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-champagne/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium text-foreground/70 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-champagne" />
            <span>Featured Ateliers</span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium tracking-[-0.02em]">
            The designers
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Independent ateliers and houses from Paris to Tokyo. Each piece is
            hand-selected — and ready to try on with AI.
          </p>
          {!isDesigner() && (
            <motion.button onClick={handleBecomeDesigner}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="mt-6 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              Become a designer
            </motion.button>
          )}
        </motion.div>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-20">Loading designers…</div>
        ) : designers.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">No designers yet.</div>
        ) : (
          <div className="space-y-12">
            {designers.map((d, i) => (
              <DesignerRow key={d.id} designer={d} index={i} onTryOn={handleTryOnProduct} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function DesignerRow({ designer, index, onTryOn }: { designer: Designer; index: number; onTryOn: (p: Product) => void }) {
  const { data: products = [], isLoading } = useProducts({ designer: designer.id });

  return (
    <motion.article
      key={designer.id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: EASE }}
      className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start"
    >
      {/* Designer profile */}
      <div className="lg:col-span-4 lg:sticky lg:top-24">
        <div className="relative rounded-3xl overflow-hidden shadow-premium-lg">
          <div className="aspect-[4/5] relative">
            <img
              src={designer.coverImage || designer.avatar}
              alt={designer.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 p-5">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-serif text-2xl text-background">
                  {designer.name}
                </h3>
                {designer.verified && (
                  <BadgeCheck className="w-5 h-5 text-champagne" />
                )}
              </div>
              <p className="text-background/80 text-sm italic">
                {designer.tagline}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {designer.location}
            </span>
            <span>·</span>
            <span>{designer.collectionCount} pieces</span>
            <span>·</span>
            <span>★ {designer.rating} rating</span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {designer.bio}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {designer.specialties.map((s) => (
              <span
                key={s}
                className="px-2.5 py-1 text-[11px] rounded-full bg-muted"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Garments */}
      <div className="lg:col-span-8">
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-8">Loading pieces…</div>
        ) : products.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8">No pieces yet.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {products.map((g, gi) => (
              <motion.button
                key={g.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: gi * 0.05, duration: 0.4 }}
                onClick={() => onTryOn(g)}
                className="group text-left"
              >
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted mb-2">
                  <img
                    src={g.images[0]?.url || g.image}
                    alt={g.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-1.5 rounded-full glass-strong text-[11px] font-medium inline-flex items-center gap-1">
                      Try On <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                  {g.featured && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full glass-strong text-[10px] font-medium">
                      Featured
                    </div>
                  )}
                </div>
                <div className="text-xs font-medium leading-tight line-clamp-1">
                  {g.name}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  ₦{g.price.toLocaleString()}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
}
