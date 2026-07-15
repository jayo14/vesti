"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Camera,
  X,
  ImageIcon,
  AlertCircle,
  Loader2,
  Check,
  Sparkles,
} from "lucide-react";
import { useWardrobeStore } from "@/lib/wardrobe-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { WardrobeAnalysisResponse, WardrobeItem } from "@/lib/types";

const MAX_FILE_MB = 8;
const MAX_DIMENSION = 1024;

async function readFileAsDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    throw new Error(`Image must be under ${MAX_FILE_MB}MB.`);
  }
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Could not read file."));
      reader.readAsDataURL(file);
    });
  }
  let { width, height } = bitmap;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", 0.9);
}

interface WardrobeUploaderProps {
  /** Called after each item is successfully added */
  onItemAdded?: (item: WardrobeItem) => void;
  /** Compact variant for inline placement */
  compact?: boolean;
}

export function WardrobeUploader({
  onItemAdded,
  compact = false,
}: WardrobeUploaderProps) {
  const { addItem, setIsAnalyzing, setAnalyzingCount, isAnalyzing, analyzingCount } =
    useWardrobeStore();
  const [isDragging, setIsDragging] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<
    { id: string; image: string; status: "pending" | "analyzing" | "done" | "error" }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzePhoto = useCallback(
    async (photoId: string, imageDataUrl: string) => {
      setPendingPhotos((cur) =>
        cur.map((p) => (p.id === photoId ? { ...p, status: "analyzing" } : p))
      );
      try {
        const res = await fetch("/api/wardrobe/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageDataUrl }),
        });
        const data: WardrobeAnalysisResponse = await res.json();
        if (!data.success || !data.item) {
          throw new Error(data.error || "Analysis failed.");
        }
        const newItem: WardrobeItem = {
          id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          image: imageDataUrl,
          createdAt: Date.now(),
          ...data.item,
        };
        addItem(newItem);
        setPendingPhotos((cur) =>
          cur.map((p) => (p.id === photoId ? { ...p, status: "done" } : p))
        );
        onItemAdded?.(newItem);
        // Remove from pending after a brief success animation
        setTimeout(() => {
          setPendingPhotos((cur) => cur.filter((p) => p.id !== photoId));
        }, 1500);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Analysis failed.";
        setPendingPhotos((cur) =>
          cur.map((p) =>
            p.id === photoId ? { ...p, status: "error" } : p
          )
        );
        toast.error(`Couldn't analyze photo: ${msg}`);
        // Remove failed photo after 3s
        setTimeout(() => {
          setPendingPhotos((cur) => cur.filter((p) => p.id !== photoId));
        }, 3000);
      }
    },
    [addItem, onItemAdded]
  );

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const fileArray = Array.from(files).slice(0, 5); // max 5 at a time
      const newPhotos: typeof pendingPhotos = [];
      for (const file of fileArray) {
        try {
          const dataUrl = await readFileAsDataUrl(file);
          const id = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          newPhotos.push({ id, image: dataUrl, status: "pending" });
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Upload failed.");
        }
      }
      if (newPhotos.length === 0) return;
      setPendingPhotos((cur) => [...cur, ...newPhotos]);
      setIsAnalyzing(true);
      setAnalyzingCount(newPhotos.length);

      // Analyze each photo (sequentially to avoid rate limits)
      for (const photo of newPhotos) {
        await analyzePhoto(photo.id, photo.image);
      }

      setIsAnalyzing(false);
      setAnalyzingCount(0);
    },
    [analyzePhoto, setIsAnalyzing, setAnalyzingCount]
  );

  return (
    <div className={cn(compact ? "" : "p-6 rounded-3xl border border-border bg-card")}>
      {!compact && (
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-champagne" />
          <h3 className="font-serif text-lg font-medium">Upload your clothes</h3>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "relative rounded-2xl border-2 border-dashed transition-all overflow-hidden bg-muted/30",
          isDragging ? "border-champagne bg-champagne/5" : "border-border",
          compact ? "p-4" : "p-6"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center text-center">
          <div
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors",
              isDragging ? "bg-champagne/20" : "bg-foreground/5"
            )}
          >
            <Upload className="w-5 h-5 text-foreground/70" />
          </div>
          <p className="text-sm font-medium mb-1">
            {isAnalyzing
              ? `Analyzing ${analyzingCount} photo${analyzingCount !== 1 ? "s" : ""}…`
              : "Drag photos here or upload"}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            AI will auto-categorize each item. Up to 5 at a time. JPG/PNG, max {MAX_FILE_MB}MB.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Upload Photos
            </button>
          </div>
        </div>
      </div>

      {/* Pending photos (analyzing) */}
      <AnimatePresence>
        {pendingPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              {isAnalyzing ? "AI is categorizing…" : "Recently added"}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {pendingPhotos.map((photo) => (
                <motion.div
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative aspect-square rounded-xl overflow-hidden bg-muted"
                >
                  <img
                    src={photo.image}
                    alt="Uploading"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    {photo.status === "analyzing" && (
                      <Loader2 className="w-5 h-5 animate-spin text-champagne" />
                    )}
                    {photo.status === "done" && (
                      <Check className="w-6 h-6 text-emerald-500" strokeWidth={3} />
                    )}
                    {photo.status === "error" && (
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
