import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import WardrobeSection from "@/components/sections/wardrobe-section";

export const metadata: Metadata = {
  title: "Your Wardrobe — VESTI",
  description: "Upload, organise and style your digital wardrobe.",
};

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
