import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VESTI — Fashion, your way",
  description: "Discover, design, and wear what you love with AI-powered fashion.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
