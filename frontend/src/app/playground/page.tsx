import SiteHeader from "@/components/site-header";
import PlaygroundSection from "@/components/sections/playground-section";

export default function PlaygroundPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <PlaygroundSection />
      </main>
    </div>
  );
}
