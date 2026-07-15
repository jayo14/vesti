import SiteHeader from "@/components/site-header";
import WardrobeSection from "@/components/sections/wardrobe-section";

export default function WardrobePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <WardrobeSection />
      </main>
    </div>
  );
}
