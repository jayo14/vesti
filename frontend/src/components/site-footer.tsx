"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Instagram, Twitter, Youtube } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { toast } from "sonner";
import { useState } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

export function SiteFooter() {
  const setView = useStudioStore((s) => s.setView);
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success("You're on the list. Welcome to the studio.");
    setEmail("");
  };

  return (
    <footer className="relative mt-auto border-t border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="rounded-3xl bg-foreground text-background p-8 sm:p-12 mb-16 relative overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-champagne/30 blur-[80px]" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-champagne/20 blur-[80px]" />
          <div className="relative grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/10 text-xs font-medium mb-4">
                <Sparkles className="w-3.5 h-3.5 text-champagne" />
                <span>Weekly drop</span>
              </div>
              <h3 className="font-serif text-3xl sm:text-4xl font-medium tracking-[-0.02em] leading-tight">
                Get the studio newsletter.
              </h3>
              <p className="mt-3 text-background/70 max-w-md text-sm leading-relaxed">
                New designers, AI feature drops, and styling tips — delivered
                once a week. No spam.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                className="flex-1 px-5 py-3 rounded-full bg-background/10 border border-background/20 text-background placeholder:text-background/50 focus:outline-none focus:ring-2 focus:ring-background/30"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-full bg-background text-foreground text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                Subscribe
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>

        {/* Links grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-background" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-serif text-base font-medium">AI Fashion</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Studio
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Your personal stylist, designer, and boutique — powered by AI.
            </p>
          </div>

          {[
            {
              title: "Studio",
              links: [
                { label: "Try-On Studio", view: "studio" as const },
                { label: "Playground", view: "playground" as const },
                { label: "Wardrobe", view: "wardrobe" as const },
                { label: "How it works", view: "hero" as const },
              ],
            },
            {
              title: "Shop",
              links: [
                { label: "Marketplace", view: "marketplace" as const },
                { label: "Designers", view: "designers" as const },
                { label: "Featured pieces", view: "marketplace" as const },
              ],
            },
            {
              title: "About",
              links: [
                { label: "Our story", view: "hero" as const },
                { label: "Privacy", view: "hero" as const },
                { label: "Terms", view: "hero" as const },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <button
                      onClick={() => {
                        setView(l.view);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="text-sm text-foreground/80 hover:text-foreground transition-colors"
                    >
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} AI Fashion Studio. Crafted with care.
          </p>
          <div className="flex items-center gap-1">
            {[Instagram, Twitter, Youtube].map((Icon, i) => (
              <button
                key={i}
                className="w-9 h-9 rounded-full hover:bg-foreground/5 flex items-center justify-center transition-colors"
                aria-label="Social link"
              >
                <Icon className="w-4 h-4 text-foreground/70" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
