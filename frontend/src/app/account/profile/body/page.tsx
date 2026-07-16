"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Ruler, ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function BodyProfilePage() {
  const { token } = useAuthStore();
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!token) { toast.error("Sign in first"); return; }
    setSaving(true);
    try {
      // TODO: POST to /api/profile/body
      await new Promise((r) => setTimeout(r, 800));
      toast.success("Body profile saved.");
    } catch {
      toast.error("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <section className="min-h-screen pt-28 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center py-20">
          <Ruler className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-lg text-muted-foreground">Sign in to set your body profile.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-28 pb-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-10">
          <Link href="/account" className="p-2 rounded-full hover:bg-foreground/5 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Ruler className="w-6 h-6" />
          <h1 className="text-3xl font-serif font-medium">Body Profile</h1>
        </div>

        <p className="text-sm text-muted-foreground mb-8">
          Your measurements help the AI provide accurate fit analysis and size recommendations.
          All data is stored securely and never shared.
        </p>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Height (cm)", value: height, set: setHeight, placeholder: "170" },
            { label: "Weight (kg)", value: weight, set: setWeight, placeholder: "65" },
            { label: "Chest (cm)", value: chest, set: setChest, placeholder: "96" },
            { label: "Waist (cm)", value: waist, set: setWaist, placeholder: "78" },
            { label: "Hips (cm)", value: hips, set: setHips, placeholder: "94" },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">{field.label}</label>
              <input
                type="number"
                value={field.value}
                onChange={(e) => field.set(e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-card/50 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-shadow"
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-8 w-full py-3 rounded-full bg-foreground text-background text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Measurements
        </button>
      </div>
    </section>
  );
}
