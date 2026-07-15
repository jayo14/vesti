"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Shirt,
  Sparkles,
  ChevronRight,
  Info,
  RotateCcw,
  ImageIcon,
  Layers,
} from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { getMaterial } from "@/lib/materials";
import { PhotoUploader } from "./photo-uploader";
import { GarmentSelector } from "./garment-selector";
import { GenerationPanel } from "./generation-panel";
import { ComparisonViewer } from "./comparison-viewer";
import { ActionBar } from "./action-bar";
import { MaterialPicker } from "./material-picker";

const EASE = [0.22, 1, 0.36, 1] as const;

export function StudioSection() {
  const {
    personImage,
    setPersonImage,
    selectedGarment,
    customGarmentImage,
    garmentSource,
    selectedMaterial,
    setSelectedMaterial,
    resultImage,
    isGenerating,
    resetGeneration,
    setView,
  } = useStudioStore();

  const [garmentPickerOpen, setGarmentPickerOpen] = useState(false);
  // Derived: result is visible whenever we have one and aren't mid-generation.
  const showResult = !!resultImage && !isGenerating;

  const garmentImage = customGarmentImage || selectedGarment?.image || null;
  const garmentName = selectedGarment?.name || (customGarmentImage ? "Custom Garment" : null);

  // Auto-select material when a marketplace garment has its own material.
  // Allow the user to override afterwards — the override is sticky until they
  // pick a different garment (which re-defaults to that garment's material).
  useEffect(() => {
    if (selectedGarment?.material) {
      setSelectedMaterial(selectedGarment.material);
    } else if (garmentSource === "upload") {
      // For custom uploads we don't know the fabric — let the user pick.
      // Leave the current selection alone so they can experiment.
    }
  }, [selectedGarment?.id, garmentSource, setSelectedMaterial]);

  const handleStartOver = () => {
    resetGeneration();
    setPersonImage(null);
  };

  return (
    <section className="relative min-h-screen pt-24 pb-32">
      {/* Subtle ambient bg */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] rounded-full bg-champagne/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium text-foreground/70 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-champagne" />
            <span>AI Virtual Try-On Studio</span>
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium tracking-[-0.02em]">
            Create your look
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Upload your photo, choose any garment, and let AI dress you in
            seconds — preserving your face, pose, and lighting.
          </p>
        </motion.div>

        {/* Stepper */}
        <div className="mb-8 flex items-center justify-center">
          <Stepper
            steps={[
              { num: 1, label: "Your photo", done: !!personImage, active: !personImage },
              {
                num: 2,
                label: "Garment",
                done: !!garmentImage,
                active: !!personImage && !garmentImage,
              },
              {
                num: 3,
                label: "Generate",
                done: !!resultImage,
                active: !!personImage && !!garmentImage && !resultImage,
              },
            ]}
          />
        </div>

        {/* Main 2-col workspace */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left column: inputs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
            className="lg:col-span-7 space-y-4"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Step 1: Person photo */}
              <div className="p-4 rounded-3xl border border-border bg-card shadow-premium">
                <StepHeader num={1} icon={User} label="Your photo" done={!!personImage} />
                <div className="mt-3">
                  <PhotoUploader
                    label=""
                    description=""
                    image={personImage}
                    onImage={setPersonImage}
                    emptyIcon={User}
                    emptyHint="Upload a full-body photo"
                  />
                </div>
              </div>

              {/* Step 2: Garment */}
              <div className="p-4 rounded-3xl border border-border bg-card shadow-premium">
                <StepHeader
                  num={2}
                  icon={Shirt}
                  label="Garment"
                  done={!!garmentImage}
                />
                <div className="mt-3">
                  {!garmentImage ? (
                    <button
                      onClick={() => setGarmentPickerOpen(true)}
                      className="w-full aspect-[4/5] rounded-2xl border-2 border-dashed border-border hover:border-champagne hover:bg-champagne/5 transition-all flex flex-col items-center justify-center p-6 text-center group"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-foreground/5 group-hover:bg-champagne/15 flex items-center justify-center mb-3 transition-colors">
                        <Shirt className="w-6 h-6 text-foreground/70" />
                      </div>
                      <p className="text-sm font-medium mb-1">Choose a garment</p>
                      <p className="text-xs text-muted-foreground">
                        Browse marketplace, upload, or pick a designer
                      </p>
                    </button>
                  ) : (
                    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
                      <img
                        src={garmentImage}
                        alt={garmentName || "Garment"}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full glass-strong text-[11px] font-medium">
                        {garmentSource === "upload" ? "Your upload" : selectedGarment?.designer}
                      </div>
                      <button
                        onClick={() => setGarmentPickerOpen(true)}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full glass-strong flex items-center justify-center hover:scale-105 transition-transform"
                        aria-label="Change garment"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      {selectedGarment && (
                        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-foreground/80 to-transparent">
                          <div className="text-background text-sm font-medium truncate">
                            {selectedGarment.name}
                          </div>
                          <div className="text-background/80 text-xs">
                            ${selectedGarment.price.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Comparison / Result viewer */}
            <div className="p-4 rounded-3xl border border-border bg-card shadow-premium">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Preview</span>
                  {resultImage && !isGenerating && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-champagne">
                      <Sparkles className="w-3 h-3" /> AI Generated
                    </span>
                  )}
                </div>
                {resultImage && !isGenerating && (
                  <button
                    onClick={handleStartOver}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Start over
                  </button>
                )}
              </div>

              <div className="aspect-[3/4] sm:aspect-[16/10] relative">
                <AnimatePresence mode="wait">
                  {showResult && resultImage && !isGenerating ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0"
                    >
                      <ComparisonViewer
                        beforeImage={personImage!}
                        afterImage={resultImage}
                        beforeLabel="You"
                        afterLabel="AI Look"
                      />
                    </motion.div>
                  ) : isGenerating ? (
                    <motion.div
                      key="generating"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0"
                    >
                      <GenerationPanel />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0"
                    >
                      <GenerationPanel />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Right column: details + tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
            className="lg:col-span-5 space-y-4"
          >
            {/* Selected garment details */}
            <div className="p-6 rounded-3xl border border-border bg-card shadow-premium">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-xl">Look details</h3>
                <Info className="w-4 h-4 text-muted-foreground" />
              </div>

              {selectedGarment ? (
                <div className="space-y-4">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {selectedGarment.designer}
                  </div>
                  <div className="font-medium text-lg">{selectedGarment.name}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedGarment.description}
                  </p>
                  {selectedGarment.material && (
                    <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-muted/60">
                      <span
                        className="w-4 h-4 rounded-full ring-1 ring-inset ring-black/10"
                        style={{
                          background:
                            getMaterial(selectedGarment.material)?.swatchPattern ||
                            getMaterial(selectedGarment.material)?.swatch,
                        }}
                      />
                      <span className="text-xs font-medium">
                        {getMaterial(selectedGarment.material)?.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        · {getMaterial(selectedGarment.material)?.origin}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div>
                      <div className="text-xs text-muted-foreground">Price</div>
                      <div className="font-serif text-2xl">
                        ${selectedGarment.price.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {selectedGarment.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="px-2 py-1 text-[10px] rounded-full bg-muted"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : customGarmentImage ? (
                <div className="space-y-3">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Your upload
                  </div>
                  <div className="font-medium text-lg">Custom Garment</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    AI will analyze the garment from your uploaded image and dress
                    you in it, preserving fabric, fit, and details.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">
                    Choose a garment to see details here.
                  </p>
                </div>
              )}
            </div>

            {/* AI Material-Aware Design picker */}
            <div className="p-6 rounded-3xl border border-border bg-card shadow-premium">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-champagne" />
                <h3 className="font-serif text-xl">Material-Aware AI</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Pick a fabric and the AI will design constructions that fabric
                can actually support — no impossible shapes, just true-to-life
                drape, sheen, and structure.
              </p>
              <MaterialPicker
                value={selectedMaterial}
                onChange={(m) => setSelectedMaterial(m)}
              />
            </div>

            {/* AI quality controls / info */}
            <div className="p-6 rounded-3xl border border-border bg-card shadow-premium">
              <h3 className="font-serif text-xl mb-3">How it works</h3>
              <ol className="space-y-3 text-sm">
                {[
                  "Upload a clear, full-body photo of yourself.",
                  "Pick a garment from the marketplace, upload one, or browse designers.",
                  "AI analyzes your pose, body type, and lighting — then renders the garment on you.",
                  "Compare before/after, save your look, share it, or purchase the garment.",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-foreground text-background text-xs font-medium flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-foreground/80 leading-relaxed pt-0.5">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Quality assurances */}
            <div className="p-6 rounded-3xl border border-border bg-gradient-to-br from-champagne-muted/40 to-transparent">
              <h3 className="font-serif text-xl mb-3">AI quality promises</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  "Facial features preserved",
                  "Body proportions intact",
                  "Pose & stance maintained",
                  "Realistic fabric draping",
                  "Natural shadows & light",
                  "Cloth-body interaction",
                ].map((q) => (
                  <div key={q} className="flex items-start gap-1.5">
                    <ChevronRight className="w-3 h-3 mt-0.5 text-champagne flex-shrink-0" />
                    <span className="text-foreground/80">{q}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Garment picker modal */}
      <GarmentSelector
        open={garmentPickerOpen}
        onOpenChange={setGarmentPickerOpen}
      />

      {/* Floating action bar (save / share / download / purchase) */}
      <ActionBar visible={!!resultImage && !isGenerating} />

      {/* Mobile fallback for picker */}
      {!personImage && (
        <div className="text-center mt-6 lg:hidden">
          <button
            onClick={() => setView("marketplace")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Or browse the marketplace first →
          </button>
        </div>
      )}
    </section>
  );
}

function StepHeader({
  num,
  icon: Icon,
  label,
  done,
}: {
  num: number;
  icon: typeof User;
  label: string;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
          done ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
        }`}
      >
        {done ? "✓" : num}
      </div>
      <span className="text-sm font-medium flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
    </div>
  );
}

function Stepper({
  steps,
}: {
  steps: { num: number; label: string; done: boolean; active: boolean }[];
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-4">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center gap-2 sm:gap-4">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              s.done
                ? "bg-foreground text-background"
                : s.active
                ? "glass-strong"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                s.done ? "bg-background text-foreground" : "bg-foreground/10"
              }`}
            >
              {s.done ? "✓" : s.num}
            </span>
            {s.label}
          </div>
          {i < steps.length - 1 && (
            <div className="w-6 sm:w-10 h-px bg-border" />
          )}
        </div>
      ))}
    </div>
  );
}
