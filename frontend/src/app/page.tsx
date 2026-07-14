"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useStudioStore } from "@/lib/store";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroSection } from "@/components/sections/hero-section";
import { StudioSection } from "@/components/studio/studio-section";
import { MarketplaceSection } from "@/components/sections/marketplace-section";
import { DesignersSection } from "@/components/sections/designers-section";
import { WardrobeSection } from "@/components/sections/wardrobe-section";
import { PlaygroundSection } from "@/components/sections/playground-section";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Home() {
  const view = useStudioStore((s) => s.view);
  const theme = useStudioStore((s) => s.theme);

  // Apply theme class to <html>
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  return (
    <div className="relative min-h-screen flex flex-col bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            {view === "hero" && <HeroSection />}
            {view === "studio" && <StudioSection />}
            {view === "marketplace" && <MarketplaceSection />}
            {view === "designers" && <DesignersSection />}
            {view === "wardrobe" && <WardrobeSection />}
            {view === "playground" && <PlaygroundSection />}
          </motion.div>
        </AnimatePresence>
      </main>

      <SiteFooter />
    </div>
  );
}
