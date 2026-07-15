import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import StudioSection from "@/components/studio/studio-section";

export const metadata: Metadata = {
  title: "Design Studio — VESTI",
  description: "Create and edit garments using AI-powered design tools.",
};

export default function StudioPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <StudioSection />
      </main>
      <SiteFooter />
    </div>
  );
}
