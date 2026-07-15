import SiteHeader from "@/components/site-header";
import MarketplaceSection from "@/components/sections/marketplace-section";

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
