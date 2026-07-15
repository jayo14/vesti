import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import DesignersSection from "@/components/sections/designers-section";

export const metadata: Metadata = {
  title: "Independent Designers — VESTI",
  description: "Discover emerging fashion talent and one-of-a-kind pieces.",
};

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
