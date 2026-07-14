"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Undo2,
  Redo2,
  RotateCcw,
  Wand2,
  Loader2,
  ImageOff,
  Download,
} from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEdit } from "@/hooks/use-edit";

interface PreviewCanvasProps {
  /** Called when the user wants to load an image into the playground. */
  onLoadImage: () => void;
}

export function PreviewCanvas({ onLoadImage }: PreviewCanvasProps) {
  const {
    playgroundImage,
    playgroundOriginImage,
    playgroundHistory,
    playgroundVersion,
    isEditing,
    undoEdit,
    redoEdit,
    resetPlayground,
    stage,
  } = useStudioStore();

  const { progress } = useEdit();

  const [sliderPos, setSliderPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasImage = !!playgroundImage;
  const canUndo = playgroundVersion >= 0;
  const canRedo = playgroundVersion < playgroundHistory.length - 1;
  const hasEdits = playgroundHistory.length > 0;

  // Determine before/after for the comparison slider.
  // After = current image. Before = previous version (origin or prev edit).
  const afterImage = playgroundImage;
  const beforeImage =
    playgroundVersion === -1
      ? playgroundOriginImage
      : playgroundHistory[playgroundVersion]?.beforeImage ||
        playgroundOriginImage;

  const updateSlider = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pct)));
  }, []);

  const handleDownload = () => {
    if (!playgroundImage) return;
    const a = document.createElement("a");
    a.href = playgroundImage;
    a.download = `playground-v${playgroundVersion + 2}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Image downloaded.");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-1.5">
          <h3 className="font-serif text-base font-medium">Preview</h3>
          {hasEdits && (
            <span className="text-[11px] text-muted-foreground">
              · v{playgroundVersion + 2}
              {playgroundVersion === playgroundHistory.length - 1 && " (latest)"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={undoEdit}
            disabled={!canUndo || isEditing}
            icon={<Undo2 className="w-3.5 h-3.5" />}
            label="Undo"
          />
          <ToolbarButton
            onClick={redoEdit}
            disabled={!canRedo || isEditing}
            icon={<Redo2 className="w-3.5 h-3.5" />}
            label="Redo"
          />
          <ToolbarButton
            onClick={() => {
              resetPlayground();
              toast.success("Reset to original.");
            }}
            disabled={!hasEdits || isEditing}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            label="Reset"
          />
          <div className="w-px h-5 bg-border mx-0.5" />
          <ToolbarButton
            onClick={() => setShowCompare((v) => !v)}
            disabled={!hasEdits || isEditing}
            icon={<CompareIcon active={showCompare} />}
            label="Compare"
            active={showCompare}
          />
          <ToolbarButton
            onClick={handleDownload}
            disabled={!hasImage || isEditing}
            icon={<Download className="w-3.5 h-3.5" />}
            label="Save"
          />
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative bg-muted/20 p-4 min-h-[400px]">
        {!hasImage ? (
          <EmptyState onLoadImage={onLoadImage} />
        ) : (
          <div className="relative h-full w-full max-w-md mx-auto">
            {/* Image container */}
            <div
              ref={containerRef}
              className={cn(
                "relative h-full w-full rounded-2xl overflow-hidden bg-muted shadow-premium",
                showCompare && hasEdits && "cursor-ew-resize"
              )}
              onPointerDown={
                showCompare && hasEdits
                  ? (e) => {
                      setDragging(true);
                      updateSlider(e.clientX);
                      (e.target as Element).setPointerCapture(e.pointerId);
                    }
                  : undefined
              }
              onPointerMove={
                showCompare && hasEdits && dragging
                  ? (e) => updateSlider(e.clientX)
                  : undefined
              }
              onPointerUp={showCompare ? () => setDragging(false) : undefined}
              onPointerCancel={showCompare ? () => setDragging(false) : undefined}
            >
              {/* After image (current) */}
              <img
                src={afterImage || undefined}
                alt="Current design"
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />

              {/* Before image overlay (only when comparing & there's history) */}
              {showCompare && hasEdits && (
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={beforeImage || undefined}
                    alt="Previous design"
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ width: `${100 / (sliderPos / 100)}%` }}
                    draggable={false}
                  />
                </div>
              )}

              {/* Labels */}
              {showCompare && hasEdits && (
                <>
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full glass-strong text-[11px] font-medium pointer-events-none">
                    Before
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full glass-strong text-[11px] font-medium pointer-events-none">
                    After
                  </div>
                  {/* Slider handle */}
                  <div
                    className="absolute top-0 bottom-0 pointer-events-none"
                    style={{
                      left: `${sliderPos}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <div className="w-0.5 h-full bg-background shadow-[0_0_8px_rgba(0,0,0,0.4)]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-strong flex items-center justify-center shadow-premium">
                      <Wand2 className="w-4 h-4" />
                    </div>
                  </div>
                </>
              )}

              {/* Editing overlay */}
              <AnimatePresence>
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-background/70 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
                  >
                    <div className="relative w-20 h-20 mb-4">
                      <svg
                        viewBox="0 0 100 100"
                        className="absolute inset-0 animate-spin-slow"
                      >
                        <defs>
                          <linearGradient
                            id="editRing"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor="oklch(0.85 0.13 75)" />
                            <stop
                              offset="100%"
                              stopColor="oklch(0.18 0.005 280)"
                            />
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
                          stroke="url(#editRing)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray="60 200"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Wand2 className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="font-serif text-base mb-1">{stage}</div>
                    <div className="w-full max-w-[200px]">
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-champagne to-foreground"
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <div className="mt-1.5 text-[10px] text-muted-foreground">
                        {Math.round(progress)}%
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  disabled,
  icon,
  label,
  active,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
        disabled
          ? "text-muted-foreground/40 cursor-not-allowed"
          : active
          ? "bg-foreground text-background"
          : "text-foreground/70 hover:bg-foreground/5"
      )}
    >
      {icon}
    </button>
  );
}

function CompareIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="1" y="2" width="6" height="12" rx="1" />
      <rect x="9" y="2" width="6" height="12" rx="1" />
      {active && <line x1="8" y1="0" x2="8" y2="16" stroke="currentColor" strokeWidth="1" />}
    </svg>
  );
}

function EmptyState({ onLoadImage }: { onLoadImage: () => void }) {
  return (
    <div className="h-full w-full rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center mb-4">
        <ImageOff className="w-7 h-7 text-foreground/40" />
      </div>
      <h3 className="font-serif text-xl mb-2">Nothing to edit yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Load an image to start editing. You can pull in a Studio try-on result,
        open a saved look from your wardrobe, or start from a designer garment.
      </p>
      <button
        onClick={onLoadImage}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <Wand2 className="w-4 h-4" />
        Load an image
      </button>
    </div>
  );
}
