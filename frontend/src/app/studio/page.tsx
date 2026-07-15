import SiteHeader from "@/components/site-header";
import StudioSection from "@/components/studio/studio-section";

export default function StudioPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <SiteHeader />
      <main>
        <StudioSection />
      </main>
    </div>
  );
}
