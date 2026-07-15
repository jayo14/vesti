import SiteHeader from "@/components/site-header";
import DesignersSection from "@/components/sections/designers-section";

export default function DesignersPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <DesignersSection />
      </main>
    </div>
  );
}
