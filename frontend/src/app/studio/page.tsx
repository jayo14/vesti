import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import StudioSection from "@/components/studio/studio-section";

export const metadata: Metadata = {
  title: "Design Studio — VESTI",
  description: "Create and edit garments using AI-powered design tools.",
};

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
