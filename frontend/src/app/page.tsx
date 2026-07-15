import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import HeroSection from "@/components/sections/hero-section";
import MarketplaceSection from "@/components/sections/marketplace-section";
import WardrobeSection from "@/components/sections/wardrobe-section";
import DesignersSection from "@/components/sections/designers-section";
import PlaygroundSection from "@/components/sections/playground-section";

export default function Page() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <HeroSection />
        <MarketplaceSection />
        <WardrobeSection />
        <DesignersSection />
        <PlaygroundSection />
      </main>
      <SiteFooter />
    </div>
  );
}
