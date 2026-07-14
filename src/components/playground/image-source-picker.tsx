"use client";

import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Image as ImageIcon, Heart, Wand2 } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { FEATURED_GARMENTS } from "@/lib/data";

interface ImageSourcePickerProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPick: (image: string, label: string) => void;
}

export function ImageSourcePicker({
  open,
  onOpenChange,
  onPick,
}: ImageSourcePickerProps) {
  const { savedLooks, resultImage, personImage } = useStudioStore();

  const sources: {
    id: string;
    label: string;
    sub: string;
    icon: typeof ImageIcon;
    image?: string | null;
    disabled?: boolean;
    badge?: string;
  }[] = [
    {
      id: "studio",
      label: "Studio result",
      sub: resultImage ? "Your latest AI try-on" : "Generate one in the Studio first",
      icon: Wand2,
      image: resultImage,
      disabled: !resultImage,
      badge: resultImage ? "Ready" : "Empty",
    },
    {
      id: "wardrobe",
      label: "Saved wardrobe look",
      sub: savedLooks.length
        ? `${savedLooks.length} saved look${savedLooks.length !== 1 ? "s" : ""}`
        : "No saved looks yet",
      icon: Heart,
      disabled: savedLooks.length === 0,
      badge: savedLooks.length ? `${savedLooks.length}` : "0",
    },
    {
      id: "featured",
      label: "Featured garment",
      sub: "Start from a curated piece",
      icon: Sparkles,
      badge: "3",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Load an image</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {sources.map((s) => {
            const disabled = s.disabled;
            return (
              <motion.button
                key={s.id}
                whileHover={!disabled ? { scale: 1.01 } : undefined}
                whileTap={!disabled ? { scale: 0.99 } : undefined}
                onClick={() => {
                  if (s.id === "studio" && resultImage) {
                    onPick(resultImage, "Studio result");
                    onOpenChange(false);
                  } else if (s.id === "featured") {
                    const g = FEATURED_GARMENTS[0];
                    if (g) {
                      onPick(g.image, g.name);
                      onOpenChange(false);
                    }
                  }
                  // Wardrobe is handled in the parent — show a list inline.
                  // For simplicity, we just dismiss and let parent show it.
                }}
                disabled={disabled}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border border-border text-left transition-colors ${
                  disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-foreground/[0.03]"
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center ${
                    s.image ? "" : "bg-foreground/5"
                  }`}
                >
                  {s.image ? (
                    <img
                      src={s.image}
                      alt={s.label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <s.icon className="w-5 h-5 text-foreground/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {s.sub}
                  </div>
                </div>
                {s.badge && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-foreground/70">
                    {s.badge}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Wardrobe looks inline (if any) */}
        {savedLooks.length > 0 && (
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Or pick from your wardrobe
            </div>
            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
              {savedLooks.slice(0, 12).map((look) => (
                <button
                  key={look.id}
                  onClick={() => {
                    onPick(look.resultImage, look.garmentName);
                    onOpenChange(false);
                  }}
                  className="aspect-[3/4] rounded-lg overflow-hidden border border-border hover:border-champagne transition-colors"
                >
                  <img
                    src={look.resultImage}
                    alt={look.garmentName}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
