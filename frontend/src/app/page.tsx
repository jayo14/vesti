"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useStudioStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroSection } from "@/components/sections/hero-section";
import { StudioSection } from "@/components/studio/studio-section";
import { MarketplaceSection } from "@/components/sections/marketplace-section";
import { DesignersSection } from "@/components/sections/designers-section";
import { WardrobeSection } from "@/components/sections/wardrobe-section";
import { PlaygroundSection } from "@/components/sections/playground-section";
import { EarningsSection } from "@/components/sections/earnings-section";
import { AdminSection } from "@/components/sections/admin-section";
import { DesignerDashboardSection } from "@/components/sections/designer-dashboard-section";
import { ProductPageSection } from "@/components/sections/product-page-section";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Home() {
  const view = useStudioStore((s) => s.view);
  const selectedProductId = useStudioStore((s) => s.selectedProductId);
  const theme = useStudioStore((s) => s.theme);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const openProductPage = useStudioStore((s) => s.openProductPage);
  const token = useAuthStore((s) => s.token);

  useEffect(() => { if (token) fetchUser(); }, []);

  // Deep-link support: /?product=<id> opens the dedicated product page.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("product");
    if (pid) openProductPage(pid);
  }, [openProductPage]);

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
            {view === "earnings" && <EarningsSection />}
            {view === "admin" && <AdminSection />}
            {view === "designer-dashboard" && <DesignerDashboardSection />}
            {view === "product" &&
              (selectedProductId ? (
                <ProductPageSection productId={selectedProductId} />
              ) : (
                <MarketplaceSection />
              ))}
          </motion.div>
        </AnimatePresence>
      </main>

      <SiteFooter />
    </div>
  );
}
