"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const EASE = [0.22, 1, 0.36, 1] as const;

export default function BecomeDesignerPage() {
  const { token, user } = useAuthStore();
  const [brandName, setBrandName] = useState("");
  const [bio, setBio] = useState("");
  const [portfolioLinks, setPortfolioLinks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { toast.error("Sign in first"); return; }
    if (!brandName.trim()) { toast.error("Brand name is required"); return; }
    setSubmitting(true);
    try {
      const r = await fetch(`${API_BASE}/api/auth/apply-designer/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          brand_name: brandName.trim(),
          bio: bio.trim(),
          portfolio_links: portfolioLinks.split("\n").map((l) => l.trim()).filter(Boolean),
        }),
      });
      const d = await r.json();
      if (r.ok) {
        setSubmitted(true);
        toast.success("Application submitted!");
      } else {
        toast.error(d.detail || d.error || "Failed to submit application.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <section className="min-h-screen pt-28 pb-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center py-20">
          <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-lg text-muted-foreground">Sign in to apply as a designer.</p>
        </div>
      </section>
    );
  }

  if (submitted) {
    return (
      <section className="min-h-screen pt-28 pb-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center py-20">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
            <CheckCircle className="w-20 h-20 mx-auto text-emerald-500 mb-6" />
          </motion.div>
          <h1 className="font-serif text-4xl font-medium mb-4">Application submitted!</h1>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            We&apos;ll review your application and get back to you soon.
            You&apos;ll be able to start listing products once approved.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background text-sm font-medium">
            Back to home
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-28 pb-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-foreground/80 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-champagne" />
            <span>Designer Onboarding</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-[-0.02em] mb-3">
            Become a designer
          </h1>
          <p className="text-muted-foreground mb-10 max-w-lg">
            List your creations on VESTI, reach fashion-forward customers, and get AI-powered try-ons for every piece you design.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1.5">Brand name *</label>
              <input value={brandName} onChange={(e) => setBrandName(e.target.value)}
                placeholder="Your brand or label name"
                className="w-full px-4 py-3 rounded-xl border border-border bg-card/50 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about your work, inspiration, and design philosophy..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card/50 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Portfolio links</label>
              <textarea value={portfolioLinks} onChange={(e) => setPortfolioLinks(e.target.value)}
                placeholder="One URL per line — Instagram, website, Behance, etc."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card/50 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none" />
              <p className="text-xs text-muted-foreground mt-1">One link per line. Optional but recommended.</p>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full py-3.5 rounded-full bg-foreground text-background text-sm font-medium inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Submit application
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
