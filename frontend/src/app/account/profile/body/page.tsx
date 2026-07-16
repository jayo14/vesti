"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Ruler, ArrowLeft, Camera, Save, Loader2, RefreshCw, Check, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { PhotoUploader } from "@/components/studio/photo-uploader";
import { toast } from "sonner";
import type { BodyProfile, BodyProfileMeasureResponse } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const EASE = [0.22, 1, 0.36, 1] as const;

type Step = "intro" | "upload" | "measuring" | "review" | "done";

const MEASUREMENT_LABELS: Record<string, string> = {
  shoulder: "Shoulders",
  chest: "Chest",
  waist: "Waist",
  hip: "Hips",
  arm_length: "Arm length",
  in_seam: "Inseam",
  neck: "Neck",
  bicep: "Bicep",
  forearm: "Forearm",
  thigh: "Thigh",
  calf: "Calf",
};

export default function BodyProfilePage() {
  const { token } = useAuthStore();
  const [step, setStep] = useState<Step>("intro");
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [height, setHeight] = useState("");
  const [measuring, setMeasuring] = useState(false);
  const [measureError, setMeasureError] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<Record<string, number>>({});
  const [bodyShape, setBodyShape] = useState("");
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState<BodyProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!token) { setLoadingProfile(false); return; }
    fetch(`${API_BASE}/api/auth/me/body-profile/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setExisting(data);
        setHeight(String(data.height_cm));
        setWeight(data.weight_kg ? String(data.weight_kg) : "");
        setMeasurements(data.measurements || {});
        setBodyShape(data.body_shape || "");
        if (data.measurements && Object.keys(data.measurements).length > 0) {
          setStep("review");
        }
      })
      .catch(() => { /* no profile yet */ })
      .finally(() => setLoadingProfile(false));
  }, [token]);

  const runMeasure = async () => {
    if (!token || !personImage || !height) return;
    setMeasuring(true);
    setMeasureError(null);
    try {
      const r = await fetch(`${API_BASE}/api/auth/me/body-profile/measure/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ person_image: personImage, height_cm: parseFloat(height) }),
      });
      const data: BodyProfileMeasureResponse = await r.json();
      if (data.success) {
        setMeasurements(data.measurements);
        setBodyShape(data.body_shape || "");
        setStep("review");
        toast.success("Measurements computed");
      } else {
        setMeasureError(data.error || "Measurement failed");
        toast.error(data.error || "Measurement failed");
      }
    } catch {
      toast.error("Failed to run measurement");
      setMeasureError("Could not reach the measurement service.");
    } finally {
      setMeasuring(false);
    }
  };

  const saveProfile = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE}/api/auth/me/body-profile/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          height_cm: parseFloat(height),
          weight_kg: weight ? parseFloat(weight) : null,
          body_shape: bodyShape,
          measurements,
          reference_image: personImage || existing?.reference_image || "",
        }),
      });
      if (r.ok) {
        setStep("done");
        toast.success("Body profile saved");
      } else {
        toast.error("Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const updateMeasurement = (key: string, value: string) => {
    setMeasurements((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  if (loadingProfile) {
    return (
      <section className="min-h-screen pt-28 pb-16 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </section>
    );
  }

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

        {step === "intro" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="rounded-2xl bg-muted/40 border border-border p-6 text-center">
              <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="font-serif text-xl font-medium mb-2">Measure once, try on forever</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Upload a full-body photo and we&apos;ll derive your measurements automatically.
                No more re-uploading every time you want a try-on.
              </p>
              <button onClick={() => setStep("upload")}
                className="px-6 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90">
                Get started
              </button>
            </div>
          </motion.div>
        )}

        {step === "upload" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Take or upload a full-body photo, then enter your height. The AI will derive your measurements.
            </p>

            <PhotoUploader
              label="Your photo"
              description="Full body, well-lit, one person"
              image={personImage}
              onImage={setPersonImage}
              captureFacing="environment"
              emptyHint="Upload a full-body photo"
            />

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Height (cm)</label>
              <input type="number" value={height} onChange={(e) => setHeight(e.target.value)}
                placeholder="170"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-card/50 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20" />
            </div>

            <button onClick={runMeasure} disabled={!personImage || !height || measuring}
              className="w-full py-3 rounded-full bg-foreground text-background text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50">
              {measuring ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analysing your body…</>
              ) : (
                <><Camera className="w-4 h-4" /> Run measurement</>
              )}
            </button>
          </motion.div>
        )}

        {step === "review" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-600">Measurements derived</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Review and adjust below before saving. All fields are editable.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Height (cm)</label>
                <input type="number" value={height} onChange={(e) => setHeight(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card/50 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Weight (kg) — optional</label>
                <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-card/50 text-sm" />
              </div>
            </div>

            {bodyShape && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Detected body shape:</span>
                <span className="px-2.5 py-1 rounded-full bg-muted text-xs font-medium capitalize">{bodyShape.replace("_", " ")}</span>
              </div>
            )}

            <div className="rounded-2xl bg-muted/40 border border-border p-5">
              <h3 className="text-sm font-medium mb-4">Measurements (cm)</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(measurements).map(([key, val]) => (
                  <div key={key}>
                    <label className="block text-xs text-muted-foreground mb-1">
                      {MEASUREMENT_LABELS[key] || key.replace(/_/g, " ")}
                    </label>
                    <input type="number" value={val}
                      onChange={(e) => updateMeasurement(key, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm" />
                  </div>
                ))}
              </div>
            </div>

            {personImage && (
              <div className="rounded-2xl bg-muted/40 border border-border overflow-hidden">
                <div className="aspect-[3/4] max-h-64 bg-muted">
                  <img src={personImage} alt="Reference" className="w-full h-full object-cover" />
                </div>
                <div className="px-4 py-2 text-xs text-muted-foreground">Reference photo</div>
              </div>
            )}

            <button onClick={saveProfile} disabled={saving}
              className="w-full py-3 rounded-full bg-foreground text-background text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save to profile
            </button>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="font-serif text-2xl font-medium mb-2">Body profile saved</h2>
            <p className="text-sm text-muted-foreground mb-8">
              Your measurements are now used for all try-ons. No need to re-upload.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link href="/try-on"
                className="px-6 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90">
                Try on a garment
              </Link>
              <button onClick={() => { setStep("review"); setSaving(false); }}
                className="px-6 py-2.5 rounded-full border border-border text-sm hover:bg-foreground/5">
                Edit measurements
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
