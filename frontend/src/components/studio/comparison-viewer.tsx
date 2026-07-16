"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Columns2,
  Layers,
  MoveHorizontal,
  Eye,
  EyeOff,
  Ruler,
  Target,
  Shirt,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useStudioStore } from "@/lib/store";
import type { ComparisonMode, FitAnalysis } from "@/lib/types";
import { cn } from "@/lib/utils";

const MODES: { id: ComparisonMode; label: string; icon: typeof Columns2 }[] = [
  { id: "slider", label: "Slider", icon: MoveHorizontal },
  { id: "side-by-side", label: "Side by side", icon: Columns2 },
  { id: "before-after", label: "Before / After", icon: Layers },
];

interface ComparisonViewerProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  fitAnalysis?: FitAnalysis | null;
}

export function ComparisonViewer({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  fitAnalysis,
}: ComparisonViewerProps) {
  const mode = useStudioStore((s) => s.comparisonMode);
  const setMode = useStudioStore((s) => s.setComparisonMode);
  const [sliderPos, setSliderPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [beforeAfterShow, setBeforeAfterShow] = useState<"before" | "after">(
    "after"
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const updateSlider = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pct)));
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    updateSlider(e.clientX);
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    updateSlider(e.clientX);
  };
  const handlePointerUp = () => setDragging(false);

  return (
    <div className="flex flex-col h-full">
      {/* Mode switcher */}
      <div className="flex items-center justify-center gap-1 p-1 rounded-full bg-muted mx-auto mb-4">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              "relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
              mode === m.id
                ? "text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {mode === m.id && (
              <motion.span
                layoutId="comparison-mode-pill"
                className="absolute inset-0 rounded-full bg-foreground"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <m.icon className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10 hidden sm:inline">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Viewer */}
      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {mode === "slider" && (
            <motion.div
              key="slider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative h-full"
            >
              <div
                ref={containerRef}
                className="relative h-full rounded-2xl overflow-hidden bg-muted cursor-ew-resize select-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                {/* After image (full) */}
                <img
                  src={afterImage}
                  alt={afterLabel}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />
                {/* Before image (clipped) */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={beforeImage}
                    alt={beforeLabel}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ width: `${100 / (sliderPos / 100)}%` }}
                    draggable={false}
                  />
                </div>

                {/* Labels */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full glass-strong text-[11px] font-medium pointer-events-none">
                  {beforeLabel}
                </div>
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full glass-strong text-[11px] font-medium pointer-events-none">
                  {afterLabel}
                </div>

                {/* Slider handle */}
                <div
                  className="absolute top-0 bottom-0 pointer-events-none"
                  style={{ left: `${sliderPos}%`, transform: "translateX(-50%)" }}
                >
                  <div className="w-0.5 h-full bg-background shadow-[0_0_8px_rgba(0,0,0,0.4)]" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-strong flex items-center justify-center shadow-premium">
                    <MoveHorizontal className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {mode === "side-by-side" && (
            <motion.div
              key="side-by-side"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full grid grid-cols-2 gap-3"
            >
              {[
                { img: beforeImage, label: beforeLabel },
                { img: afterImage, label: afterLabel },
              ].map((item, i) => (
                <div
                  key={i}
                  className="relative rounded-2xl overflow-hidden bg-muted"
                >
                  <img
                    src={item.img}
                    alt={item.label}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full glass-strong text-[11px] font-medium">
                    {item.label}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {mode === "before-after" && (
            <motion.div
              key="before-after"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative h-full"
            >
              <div className="relative h-full rounded-2xl overflow-hidden bg-muted">
                <AnimatePresence mode="wait">
                  {beforeAfterShow === "before" ? (
                    <motion.img
                      key="before"
                      src={beforeImage}
                      alt={beforeLabel}
                      initial={{ opacity: 0, scale: 1.02 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <motion.img
                      key="after"
                      src={afterImage}
                      alt={afterLabel}
                      initial={{ opacity: 0, scale: 1.02 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </AnimatePresence>

                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full glass-strong text-[11px] font-medium">
                  {beforeAfterShow === "before" ? beforeLabel : afterLabel}
                </div>

                {/* Toggle */}
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-center">
                  <button
                    onClick={() =>
                      setBeforeAfterShow((s) =>
                        s === "before" ? "after" : "before"
                      )
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-strong text-xs font-medium shadow-premium hover:scale-105 transition-transform"
                  >
                    {beforeAfterShow === "before" ? (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Show After
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Show Before
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fit Analysis card */}
      {fitAnalysis && <FitAnalysisCard analysis={fitAnalysis} />}
    </div>
  );
}

function FitAnalysisCard({ analysis }: { analysis: FitAnalysis }) {
  const fitIcons: Record<string, typeof CheckCircle2> = {
    true_to_size: CheckCircle2,
    runs_small: AlertTriangle,
    runs_large: XCircle,
  };
  const fitColors: Record<string, string> = {
    true_to_size: "text-green-600 dark:text-green-400",
    runs_small: "text-amber-600 dark:text-amber-400",
    runs_large: "text-red-600 dark:text-red-400",
  };
  const fitLabels: Record<string, string> = {
    true_to_size: "True to Size",
    runs_small: "Runs Small",
    runs_large: "Runs Large",
  };

  const FitIcon = fitIcons[analysis.estimated_fit] || CheckCircle2;
  const fitColor = fitColors[analysis.estimated_fit] || "";
  const fitLabel = fitLabels[analysis.estimated_fit] || analysis.estimated_fit;

  return (
    <div className="mt-4 p-4 rounded-2xl border border-border bg-card shadow-premium">
      <div className="flex items-center gap-2 mb-3">
        <Ruler className="w-4 h-4 text-champagne" />
        <h4 className="font-serif text-base">Fit Analysis</h4>
      </div>

      <div className="space-y-3">
        {/* Estimated fit badge */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Estimated fit</span>
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${fitColor}`}>
            <FitIcon className="w-3.5 h-3.5" />
            {fitLabel}
          </span>
        </div>

        {/* Recommended size */}
        {analysis.recommended_size && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Recommended size</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium">
              <Shirt className="w-3.5 h-3.5 text-champagne" />
              {analysis.recommended_size}
            </span>
          </div>
        )}

        {/* Style match percentage */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Style match</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium">
              <Target className="w-3 h-3 text-champagne" />
              {analysis.style_match_pct}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-champagne to-foreground"
              initial={{ width: 0 }}
              animate={{ width: `${analysis.style_match_pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Notes */}
        {analysis.sleeve_note && (
          <div className="flex gap-2 text-[11px] text-muted-foreground leading-relaxed">
            <span className="mt-0.5 w-1 h-1 rounded-full bg-champagne flex-shrink-0" />
            <span>{analysis.sleeve_note}</span>
          </div>
        )}
        {analysis.waist_note && (
          <div className="flex gap-2 text-[11px] text-muted-foreground leading-relaxed">
            <span className="mt-0.5 w-1 h-1 rounded-full bg-champagne flex-shrink-0" />
            <span>{analysis.waist_note}</span>
          </div>
        )}
      </div>
    </div>
  );
}
