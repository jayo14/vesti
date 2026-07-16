"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Camera, Shirt, Wand2 } from "lucide-react";
import Link from "next/link";
import { useProducts } from "@/lib/api/products";

const EASE = [0.22, 1, 0.36, 1] as const;

export function HeroSection() {
  const { data: products = [] } = useProducts();
  const featuredPieces = products.filter((p) => p.featured).slice(0, 3);

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-24 pb-16">
      {/* Ambient gradient blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-champagne/20 blur-[120px]" />
        <div className="absolute top-1/2 -right-32 w-[500px] h-[500px] rounded-full bg-foreground/5 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-champagne-muted/40 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left — copy */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-foreground/80 mb-8"
            >
              <Sparkles className="w-3.5 h-3.5 text-champagne" />
              <span>AI-Powered Virtual Styling</span>
              <span className="h-1 w-1 rounded-full bg-champagne" />
              <span className="text-muted-foreground">Now in beta</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
              className="font-serif text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-medium tracking-[-0.03em] leading-[0.95]"
            >
              Your personal
              <br />
              <span className="italic font-light">stylist,</span>{" "}
              <span className="text-gradient-gold">reimagined.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.25 }}
              className="mt-8 max-w-xl text-lg sm:text-xl text-muted-foreground leading-relaxed"
            >
              Upload a photo. Choose any garment. Watch AI dress you in seconds —
              preserving your face, your pose, your light. Then save, share, or
              buy the look. It&apos;s like having a stylist, a tailor, and a
              boutique in your pocket.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.4 }}
              className="mt-10 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/try-on"
                className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-premium"
              >
                Start Try-On
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-border bg-background/50 backdrop-blur text-sm font-medium hover:bg-foreground/5 transition-colors"
              >
                Browse Marketplace
              </Link>
            </motion.div>

            {/* Trust stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: 0.55 }}
              className="mt-12 grid grid-cols-3 gap-6 max-w-md"
            >
              {[
                { stat: "4", label: "Featured designers" },
                { stat: "16+", label: "Curated garments" },
                { stat: "<10s", label: "Generation time" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="font-serif text-2xl sm:text-3xl font-medium">
                    {s.stat}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {s.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — image collage */}
          <div className="lg:col-span-5 relative h-[500px] sm:h-[600px] lg:h-[640px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: EASE, delay: 0.2 }}
              className="absolute inset-0"
            >
              {/* Main hero image */}
              <div className="absolute top-0 right-0 w-[60%] h-[80%] rounded-3xl overflow-hidden shadow-premium-lg">
                <img
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=900&fit=crop&q=80"
                  alt="Fashion editorial"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent" />
              </div>

              {/* Secondary image — bottom left */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.5 }}
                className="absolute bottom-0 left-0 w-[55%] h-[55%] rounded-3xl overflow-hidden shadow-premium-lg"
              >
                <img
                  src="https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400&h=600&fit=crop&q=80"
                  alt="Silk dress detail"
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Floating AI tag */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.8 }}
                className="absolute top-1/2 left-0 -translate-y-1/2 glass-strong rounded-2xl p-3 shadow-premium-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-foreground flex items-center justify-center">
                    <Wand2 className="w-4 h-4 text-background" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      AI Engine
                    </div>
                    <div className="text-xs font-medium">Try-On Ready</div>
                  </div>
                </div>
              </motion.div>

              {/* Floating try-on chip */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.9 }}
                className="absolute bottom-4 right-4 glass-strong rounded-full pl-2 pr-4 py-2 flex items-center gap-2 shadow-premium"
              >
                <div className="flex -space-x-2">
                  {featuredPieces.map((g) => (
                    <img
                      key={g.id}
                      src={g.images[0]?.url || g.image}
                      alt={g.name}
                      className="w-7 h-7 rounded-full ring-2 ring-background object-cover"
                    />
                  ))}
                </div>
                <span className="text-xs font-medium">Featured pieces</span>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Feature row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.7 }}
          className="mt-20 grid sm:grid-cols-3 gap-4"
        >
          {[
            {
              icon: Camera,
              title: "Upload your photo",
              body: "Full-body shot, taken with your phone or camera. AI preserves your face and pose.",
            },
            {
              icon: Shirt,
              title: "Pick any garment",
              body: "From the marketplace, your own upload, or a designer's latest collection.",
            },
            {
              icon: Sparkles,
              title: "Get dressed by AI",
              body: "Realistic fabric, draping, shadows. Compare, save, share, or buy — instantly.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="group p-6 rounded-2xl border border-border bg-card hover:shadow-premium transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center mb-4 group-hover:bg-champagne/15 transition-colors">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-medium text-base mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.body}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
