import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import PlaygroundSection from "@/components/sections/playground-section";

export const metadata: Metadata = {
  title: "AI Playground — VESTI",
  description: "Design, edit, and try on garments using generative AI.",
};

export default function PlaygroundPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <PlaygroundSection />
      </main>
      <SiteFooter />
    </div>
  );
}
