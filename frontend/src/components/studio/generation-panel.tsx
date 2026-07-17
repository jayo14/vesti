"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Wand2,
  Loader2,
  Check,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { useAuthStore } from "@/lib/auth-store";
import type { TryOnRequest, TryOnResponse } from "@/lib/types";
import { getMaterial } from "@/lib/materials";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

const PIPELINE_STAGES = [
  { at: 0, label: "Reading your photo…" },
  { at: 10, label: "Detecting body landmarks…" },
  { at: 22, label: "Analyzing body shape…" },
  { at: 35, label: "Taking body measurements…" },
  { at: 50, label: "Analyzing the garment…" },
  { at: 65, label: "Fitting garment to your body…" },
  { at: 78, label: "Rendering the try-on…" },
  { at: 90, label: "Enhancing the result…" },
];

interface GenerationPanelProps {
  onGenerated?: () => void;
  useSavedProfile?: boolean;
  bodyProfile?: { height_cm: number; measurements: Record<string, number> } | null;
}

const PIPELINE_STAGES_SAVED = [
  { at: 0, label: "Reading your photo…" },
  { at: 15, label: "Using your saved profile…" },
  { at: 30, label: "Analyzing the garment…" },
  { at: 50, label: "Fitting garment to your body…" },
  { at: 70, label: "Rendering the try-on…" },
  { at: 90, label: "Enhancing the result…" },
];

export function GenerationPanel({ onGenerated, useSavedProfile, bodyProfile }: GenerationPanelProps) {
  const {
    personImage,
    selectedGarment,
    customGarmentImage,
    selectedMaterial,
    isGenerating,
    generationProgress,
    generationStage,
    resultImage,
    setIsGenerating,
    setGenerationProgress,
    setGenerationStage,
    setResultImage,
    setFitAnalysis,
    resetGeneration,
  } = useStudioStore();
  const token = useAuthStore((s) => s.token);

  const [error, setError] = useState<string | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pipelineStagesRef = useRef(PIPELINE_STAGES);

  const startProgressTicker = useCallback(() => {
    let p = 0;
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      p += (90 - p) * 0.04 + 0.5;
      if (p >= 90) p = 90;
      setGenerationProgress(Math.min(90, p));
      const stage = [...pipelineStagesRef.current].reverse().find((s) => p >= s.at);
      if (stage) setGenerationStage(stage.label);
    }, 250);
  }, [setGenerationProgress, setGenerationStage]);

  const stopProgressTicker = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    pipelineStagesRef.current = useSavedProfile ? PIPELINE_STAGES_SAVED : PIPELINE_STAGES;
  }, [useSavedProfile]);

  useEffect(() => {
    return () => stopProgressTicker();
  }, [stopProgressTicker]);

  const pipelineStages = useSavedProfile ? PIPELINE_STAGES_SAVED : PIPELINE_STAGES;

  const generate = useCallback(async () => {
    if (!personImage) {
      toast.error("Please upload your photo first.");
      return;
    }
    const garmentImage = customGarmentImage || selectedGarment?.image;
    if (!garmentImage) {
      toast.error("Please choose a garment to try on.");
      return;
    }

    setError(null);
    setFitAnalysis(null);
    setIsGenerating(true);
    setResultImage(null);
    setGenerationProgress(0);
    setGenerationStage(pipelineStages[0].label);
    startProgressTicker();

    try {
      const body: TryOnRequest & { use_saved_profile?: boolean } = {
        person_image: personImage,
        material: selectedMaterial || undefined,
      };

      if (useSavedProfile && bodyProfile) {
        body.use_saved_profile = true;
      }

      if (selectedGarment) {
        body.product_id = parseInt(selectedGarment.id, 10) || selectedGarment.id;
      } else {
        body.garment_image = garmentImage;
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/ai/try-on/`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data: TryOnResponse = await res.json();

      if (!data.success || !data.result_image) {
        throw new Error(data.error || "Generation failed. Please try again.");
      }

      stopProgressTicker();
      setGenerationProgress(100);
      setGenerationStage("Done");
      await new Promise((r) => setTimeout(r, 350));
      setResultImage(data.result_image);
      if (data.fit_analysis) setFitAnalysis(data.fit_analysis);
      setIsGenerating(false);
      onGenerated?.();
      toast.success("Your look is ready.");
    } catch (err) {
      stopProgressTicker();
      setIsGenerating(false);
      const msg = err instanceof Error ? err.message : "Generation failed.";
      setError(msg);
      toast.error(msg);
    }
  }, [
    personImage,
    customGarmentImage,
    selectedGarment,
    selectedMaterial,
    useSavedProfile,
    bodyProfile,
    token,
    setIsGenerating,
    setResultImage,
    setFitAnalysis,
    setGenerationProgress,
    setGenerationStage,
    startProgressTicker,
    stopProgressTicker,
    onGenerated,
  ]);

  const handleRetry = () => {
    setError(null);
    generate();
  };

  // Loading state
  if (isGenerating) {
    const materialSpec = selectedMaterial ? getMaterial(selectedMaterial) : undefined;
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="relative w-24 h-24 mb-6">
          {/* Rotating gradient ring */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 animate-spin-slow">
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="oklch(0.85 0.13 75)" />
                <stop offset="100%" stopColor="oklch(0.18 0.005 280)" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="oklch(0.92 0.002 280)"
              strokeWidth="3"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="url(#ringGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="60 200"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Wand2 className="w-7 h-7" />
          </div>
        </div>

        <motion.div
          key={generationStage}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-serif text-xl mb-2"
        >
          {generationStage || "Working…"}
        </motion.div>
        <p className="text-sm text-muted-foreground mb-3 max-w-xs">
          {materialSpec
            ? `Dressing you in ${materialSpec.name.toLowerCase()} — respecting its ${materialSpec.drape} drape and ${materialSpec.sheen} sheen.`
            : "Running the vision pipeline on your photo."}{" "}
          This usually takes 10–30 seconds.
        </p>
        {materialSpec && (
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60">
            <span
              className="w-4 h-4 rounded-full ring-1 ring-inset ring-black/10"
              style={{ background: materialSpec.swatchPattern || materialSpec.swatch }}
            />
            <span className="text-xs font-medium">{materialSpec.name}</span>
            <span className="text-[10px] text-muted-foreground capitalize">
              {materialSpec.drape} · {materialSpec.weight}
            </span>
          </div>
        )}

        {/* Progress bar */}
        <div className="w-full max-w-xs">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-champagne to-foreground rounded-full"
              animate={{ width: `${generationProgress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              AI processing
            </span>
            <span>{Math.round(generationProgress)}%</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7 text-destructive" />
        </div>
        <h3 className="font-serif text-xl mb-2">Something went wrong</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">{error}</p>
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
      </div>
    );
  }

  // Idle / ready state
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center mb-5 shadow-premium"
      >
        <Sparkles className="w-7 h-7 text-background" />
      </motion.div>

      <h3 className="font-serif text-2xl mb-2">
        {resultImage ? "Your look is ready." : "Ready to dress you."}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-3">
        {resultImage
          ? "View your result, compare with the original, and save or share your new look."
          : selectedMaterial
          ? `Your real photo will be used with ${getMaterial(selectedMaterial)?.name.toLowerCase()} material awareness.`
          : "Your real photo will be used with full body and face preservation."}
      </p>

      {selectedMaterial && (
        <div className="mb-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60">
          <span
            className="w-4 h-4 rounded-full ring-1 ring-inset ring-black/10"
            style={{
              background:
                getMaterial(selectedMaterial)?.swatchPattern ||
                getMaterial(selectedMaterial)?.swatch,
            }}
          />
          <span className="text-xs font-medium">
            {getMaterial(selectedMaterial)?.name}
          </span>
          <span className="text-[10px] text-muted-foreground capitalize">
            {getMaterial(selectedMaterial)?.drape} ·{" "}
            {getMaterial(selectedMaterial)?.sheen}
          </span>
        </div>
      )}

      <div className="h-3" />

      <button
        onClick={generate}
        disabled={!personImage || (!selectedGarment && !customGarmentImage)}
        className={cn(
          "group inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all",
          personImage && (selectedGarment || customGarmentImage)
            ? "bg-foreground text-background hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] shadow-premium"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
      >
        <Wand2 className="w-4 h-4" />
        {resultImage ? "Regenerate Look" : "Generate Try-On"}
      </button>

      {!personImage && (
        <p className="mt-3 text-xs text-muted-foreground">
          ↑ Upload your photo to begin
        </p>
      )}
      {personImage && !selectedGarment && !customGarmentImage && (
        <p className="mt-3 text-xs text-muted-foreground">
          ↑ Choose a garment to try on
        </p>
      )}
      {resultImage && (
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-champagne">
          <Check className="w-3.5 h-3.5" /> Generated successfully
        </p>
      )}
    </div>
  );
}
