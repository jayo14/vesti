"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Camera,
  X,
  ImageIcon,
  AlertCircle,
  RefreshCw,
  Check,
} from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MAX_FILE_MB = 8;
const MAX_DIMENSION = 1280;

/**
 * Read an image File, optionally downscale it so the data URL stays small,
 * and return a JPEG data URL.
 */
async function readFileAsDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    throw new Error(`Image must be under ${MAX_FILE_MB}MB.`);
  }

  // Downscale very large images using a canvas to keep the data URL manageable.
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    // Fallback — use FileReader directly.
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
  return canvas.toDataURL("image/jpeg", 0.92);
}

interface PhotoUploaderProps {
  label: string;
  description: string;
  image: string | null;
  onImage: (img: string | null) => void;
  captureFacing?: "user" | "environment";
  emptyIcon?: typeof Upload;
  emptyHint?: string;
  accentColor?: string;
}

export function PhotoUploader({
  label,
  description,
  image,
  onImage,
  captureFacing = "user",
  emptyIcon: EmptyIcon = Upload,
  emptyHint = "Drag a photo here, or use the buttons below.",
  accentColor,
}: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setLoading(true);
      try {
        const dataUrl = await readFileAsDataUrl(files[0]);
        onImage(dataUrl);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setLoading(false);
      }
    },
    [onImage]
  );

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  }, []);

  const openCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: captureFacing, width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      // Wait for next tick so the video element exists.
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch (err) {
      console.error(err);
      setCameraError(
        "Camera access was denied or is unavailable. You can upload a photo instead."
      );
    }
  }, [captureFacing]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    let w = video.videoWidth;
    let h = video.videoHeight;
    if (!w || !h) return;
    if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
      const scale = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror selfie for user-facing camera for natural feel
    if (captureFacing === "user") {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    onImage(dataUrl);
    stopCamera();
  }, [onImage, stopCamera, captureFacing]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="font-serif text-xl font-medium">{label}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
        {image && (
          <button
            onClick={() => onImage(null)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            aria-label={`Replace ${label.toLowerCase()}`}
          >
            <RefreshCw className="w-3 h-3" aria-hidden="true" /> Replace
          </button>
        )}
      </div>

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
          image ? "aspect-[3/4]" : "aspect-[4/5]"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {/* Empty state */}
        {!image && !isCameraOpen && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                isDragging ? "bg-champagne/20" : "bg-foreground/5"
              )}
              style={accentColor ? { backgroundColor: accentColor } : undefined}
            >
              <EmptyIcon className="w-6 h-6 text-foreground/70" />
            </div>
            <p className="text-sm font-medium mb-1">{emptyHint}</p>
            <p className="text-xs text-muted-foreground mb-5">
              JPG, PNG up to {MAX_FILE_MB}MB
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5" />
                )}
                {loading ? "Loading…" : "Upload Photo"}
              </button>
              <button
                onClick={openCamera}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full border border-border bg-background hover:bg-foreground/5 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                Use Camera
              </button>
            </div>
          </div>
        )}

        {/* Camera capture state */}
        {isCameraOpen && (
          <div className="absolute inset-0 flex flex-col">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "flex-1 w-full h-full object-cover bg-black",
                captureFacing === "user" && "scale-x-[-1]"
              )}
            />
            {cameraError && (
              <div className="absolute top-3 inset-x-3 p-3 rounded-xl glass-strong text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-destructive" />
                <span>{cameraError}</span>
              </div>
            )}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-center gap-3">
              <button
                onClick={stopCamera}
                className="w-12 h-12 rounded-full glass-strong flex items-center justify-center hover:scale-105 transition-transform"
                aria-label="Close camera"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-white ring-4 ring-white/40 hover:scale-105 transition-transform flex items-center justify-center"
                aria-label="Take photo"
              >
                <div className="w-12 h-12 rounded-full bg-white border-2 border-foreground/30" />
              </button>
              <div className="w-12 h-12" />
            </div>
          </div>
        )}

        {/* Image preview */}
        {image && !isCameraOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0"
          >
            <img
              src={image}
              alt={label}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3">
              <button
                onClick={() => onImage(null)}
                className="w-8 h-8 rounded-full glass-strong flex items-center justify-center hover:scale-105 transition-transform"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-strong text-[11px] font-medium">
              <Check className="w-3 h-3 text-champagne" />
              Ready
            </div>
          </motion.div>
        )}

        {/* Hidden canvas for camera capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
