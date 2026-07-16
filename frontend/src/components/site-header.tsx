"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Menu, X, ShoppingBag, Wallet, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useStudioStore } from "@/lib/store";
import type { ViewMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV_ITEMS: { id: ViewMode; label: string; icon?: typeof Sparkles }[] = [
  { id: "hero", label: "Home" },
  { id: "studio", label: "Studio" },
  { id: "playground", label: "Playground" },
  { id: "marketplace", label: "Marketplace" },
  { id: "designers", label: "Designers" },
  { id: "wardrobe", label: "Wardrobe" },
  { id: "earnings", label: "Earnings", icon: Wallet },
  { id: "admin", label: "Admin", icon: Shield },
];

export function SiteHeader() {
  const { view, setView, savedLooks } = useStudioStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (v: ViewMode) => {
    setView(v);
    setMobileOpen(false);
    // Scroll to top of main content
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          scrolled ? "py-2" : "py-4"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              "flex items-center justify-between rounded-2xl px-4 sm:px-6 h-14 transition-all duration-300",
              scrolled
                ? "glass-strong shadow-premium"
                : "bg-transparent border border-transparent"
            )}
          >
            {/* Logo */}
            <button
              onClick={() => handleNav("hero")}
              className="flex items-center gap-2 group"
              aria-label="AI Fashion Studio — Home"
            >
              <div className="relative w-8 h-8 rounded-lg bg-foreground flex items-center justify-center overflow-hidden">
                <Sparkles className="w-4 h-4 text-background" strokeWidth={2.5} />
                <div className="absolute inset-0 bg-gradient-to-br from-champagne/0 via-champagne/0 to-champagne/30 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="font-serif text-base font-medium tracking-tight">
                  AI Fashion
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Studio
                </span>
              </div>
            </button>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const active = view === item.id;
                const isEarnings = item.id === "earnings";
                const isAdmin = item.id === "admin";
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium rounded-full transition-colors",
                      active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                      (isEarnings || isAdmin) && "hidden lg:flex items-center gap-1"
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full bg-foreground/5"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1">
                      {item.icon && <item.icon className="w-3.5 h-3.5" />}
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Right side — wardrobe count + CTA */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNav("wardrobe")}
                className="relative hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-full text-muted-foreground hover:text-foreground transition-colors"
                aria-label="View wardrobe"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{savedLooks.length}</span>
              </button>
              <button
                onClick={() => handleNav("studio")}
                className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium rounded-full bg-foreground text-background hover:opacity-90 transition-opacity"
              >
                Try On
              </button>
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="md:hidden p-2 rounded-full hover:bg-foreground/5 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden bg-background/80 backdrop-blur-lg"
            onClick={() => setMobileOpen(false)}
          >
            <motion.nav
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ delay: 0.05 }}
              className="pt-24 px-6 flex flex-col gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {NAV_ITEMS.map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  onClick={() => handleNav(item.id)}
                  className={cn(
                    "text-left py-4 text-2xl font-serif border-b border-border",
                    view === item.id ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </motion.button>
              ))}
              <button
                onClick={() => handleNav("studio")}
                className="mt-6 w-full py-3 text-sm font-medium rounded-full bg-foreground text-background"
              >
                Try On Now
              </button>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
