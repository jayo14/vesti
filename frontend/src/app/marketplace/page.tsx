import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import MarketplaceSection from "@/components/sections/marketplace-section";

export const metadata: Metadata = {
  title: "Marketplace — VESTI",
  description: "Discover fresh fashion drops from independent brands.",
};

export default function MarketplacePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <MarketplaceSection />
      </main>
    </div>
  );
}
