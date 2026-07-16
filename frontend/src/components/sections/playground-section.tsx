"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wand2, Sparkles, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStudioStore } from "@/lib/store";
import { toast } from "sonner";
import { PreviewCanvas } from "@/components/playground/preview-canvas";
import { ComponentControlPanel } from "@/components/playground/component-control-panel";
import { PromptHistory } from "@/components/playground/prompt-history";
import { PromptInput } from "@/components/playground/prompt-input";
import { ImageSourcePicker } from "@/components/playground/image-source-picker";

const EASE = [0.22, 1, 0.36, 1] as const;

export function PlaygroundSection() {
  const router = useRouter();
  const {
    startPlayground,
    playgroundImage,
    playgroundHistory,
    resultImage,
  } = useStudioStore();
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);

  // If user navigates here from Studio with a fresh result, auto-load it.
  // We key on whether the playground image is empty AND the studio has a result.
  useEffect(() => {
    if (!playgroundImage && resultImage) {
      startPlayground(resultImage);
    }
  }, []);

  const handlePickImage = (image: string, label: string) => {
    startPlayground(image);
    toast.success(`Loaded "${label}" into the playground.`);
  };

  return (
    <section className="relative min-h-screen pt-24 pb-20">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 left-1/3 w-[500px] h-[500px] rounded-full bg-champagne/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium text-foreground/70 mb-3">
            <Wand2 className="w-3.5 h-3.5 text-champagne" />
            <span>AI Fashion Playground</span>
          </div>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-serif text-4xl sm:text-5xl font-medium tracking-[-0.02em]">
                Live editing workspace
              </h2>
              <p className="mt-3 text-base text-muted-foreground max-w-2xl">
                Modify any design with natural language or visual controls.
                Change sleeves, collar, neckline, buttons, embroidery, prints,
                colors, and more — changes apply interactively.
              </p>
            </div>
            {playgroundImage && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-champagne" />
                <span>
                  {playgroundHistory.length === 0
                    ? "Original image loaded"
                    : `${playgroundHistory.length} edit${
                        playgroundHistory.length !== 1 ? "s" : ""
                      } applied`}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Workspace: 3-column on desktop, stacked on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          className="grid lg:grid-cols-12 gap-4 lg:h-[calc(100vh-280px)] lg:min-h-[640px]"
        >
          {/* Left: preview canvas + prompt input */}
          <div className="lg:col-span-6 flex flex-col rounded-3xl border border-border bg-card overflow-hidden shadow-premium">
            <div className="flex-1 min-h-[500px]">
              <PreviewCanvas
                onLoadImage={() => setSourcePickerOpen(true)}
              />
            </div>
            <PromptInput />
          </div>

          {/* Center: component control panel */}
          <div className="lg:col-span-3 rounded-3xl border border-border bg-card overflow-hidden shadow-premium flex flex-col">
            <div className="flex items-center gap-2 px-4 pt-4 pb-2 border-b border-border">
              <Layers className="w-4 h-4 text-champagne" />
              <h3 className="font-serif text-base font-medium">Components</h3>
            </div>
            <div className="flex-1 overflow-hidden">
              <ComponentControlPanel />
            </div>
          </div>

          {/* Right: prompt history */}
          <div className="lg:col-span-3 rounded-3xl border border-border bg-card overflow-hidden shadow-premium flex flex-col">
            <PromptHistory />
          </div>
        </motion.div>

        {/* Empty-state hint */}
        {!playgroundImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center"
          >
            <button
              onClick={() => router.push("/try-on")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Generate a try-on in the Studio first, or load any image above
            </button>
          </motion.div>
        )}
      </div>

      <ImageSourcePicker
        open={sourcePickerOpen}
        onOpenChange={setSourcePickerOpen}
        onPick={handlePickImage}
      />
    </section>
  );
}
