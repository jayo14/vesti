"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Share2,
  Bookmark,
  ShoppingBag,
  Check,
  Link2,
  Twitter,
  Facebook,
  Mail,
  Wand2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStudioStore } from "@/lib/store";
import type { SavedLook } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ActionBarProps {
  visible: boolean;
}

export function ActionBar({ visible }: ActionBarProps) {
  const {
    personImage,
    selectedGarment,
    customGarmentImage,
    selectedMaterial,
    resultImage,
    comparisonMode,
    savedLooks,
    saveLook,
    startPlayground,
    setView,
  } = useStudioStore();

  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement("a");
    a.href = resultImage;
    const garmentName = selectedGarment?.name || "look";
    const slug = garmentName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    a.download = `ai-fashion-${slug}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Image downloaded.");
  };

  const handleSave = () => {
    if (!resultImage || !personImage) return;
    const garmentImage = customGarmentImage || selectedGarment?.image || "";
    const look: SavedLook = {
      id: `look-${Date.now()}`,
      createdAt: Date.now(),
      personImage,
      garmentImage,
      resultImage,
      garmentName: selectedGarment?.name || "Custom Garment",
      designerName: selectedGarment?.designer || "Your Upload",
      price: selectedGarment?.price || 0,
      currency: selectedGarment?.currency || "USD",
      comparisonMode,
      material: selectedMaterial || undefined,
    };
    saveLook(look);
    setSaved(true);
    toast.success("Saved to your wardrobe.");
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSendToPlayground = () => {
    if (!resultImage) return;
    startPlayground(resultImage);
    setView("playground");
    toast.success("Sent to the Playground — start editing!");
  };

  const handleShare = async (platform?: string) => {
    if (!resultImage) return;
    // Share the look — in a real product we'd upload to a CDN first.
    // For demo, we copy the data URL (which is large but works locally) or use the Web Share API.
    if (typeof navigator !== "undefined" && "share" in navigator && !platform) {
      try {
        // Convert data URL to a blob for sharing
        const res = await fetch(resultImage);
        const blob = await res.blob();
        const file = new File([blob], "ai-fashion-look.png", { type: "image/png" });
        await navigator.share({
          title: "My AI Fashion Studio Look",
          text: `Check out my AI try-on look${
            selectedGarment ? ` featuring ${selectedGarment.name} by ${selectedGarment.designer}` : ""
          }!`,
          files: [file],
        });
        return;
      } catch {
        // Fall through to copy link / open dialog
      }
    }
    if (platform === "copy") {
      try {
        await navigator.clipboard.writeText(
          `Check out my AI Fashion Studio look!`
        );
        toast.success("Share text copied to clipboard.");
        setShareOpen(false);
      } catch {
        toast.error("Could not copy.");
      }
      return;
    }
    // For demo: just toast
    toast.success(`Shared via ${platform}.`);
    setShareOpen(false);
  };

  const canAct = !!resultImage;
  const isSaved = savedLooks.some(
    (l) => l.resultImage === resultImage && resultImage
  );

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 z-40"
          >
            <div className="glass-strong rounded-full p-1.5 shadow-premium-lg flex items-center gap-1 sm:gap-2 max-w-[95vw] overflow-x-auto no-scrollbar">
              <ActionButton
                onClick={handleSave}
                disabled={!canAct}
                icon={isSaved ? Check : Bookmark}
                label={isSaved ? "Saved" : "Save"}
                accent={isSaved}
              />
              <ActionButton
                onClick={handleDownload}
                disabled={!canAct}
                icon={Download}
                label="Download"
              />
              <ActionButton
                onClick={() => setShareOpen(true)}
                disabled={!canAct}
                icon={Share2}
                label="Share"
              />
              <ActionButton
                onClick={handleSendToPlayground}
                disabled={!canAct}
                icon={Wand2}
                label="Edit"
              />
              <div className="w-px h-6 bg-border mx-0.5 hidden sm:block" />
              <button
                onClick={() => setPurchaseOpen(true)}
                disabled={!canAct || !selectedGarment}
                className={cn(
                  "inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all flex-shrink-0",
                  canAct && selectedGarment
                    ? "bg-foreground text-background hover:opacity-90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {selectedGarment
                    ? `Buy — $${selectedGarment.price.toLocaleString()}`
                    : "Purchase"}
                </span>
                <span className="sm:hidden">Buy</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Purchase modal */}
      <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Complete your purchase</DialogTitle>
          </DialogHeader>
          {selectedGarment && (
            <div className="space-y-4">
              <div className="flex gap-4 p-4 rounded-2xl bg-muted/40">
                <div className="w-20 h-28 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    src={customGarmentImage || selectedGarment.image}
                    alt={selectedGarment.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {selectedGarment.designer}
                  </div>
                  <div className="font-medium truncate">{selectedGarment.name}</div>
                  <div className="text-sm text-foreground/80 mt-1">
                    ${selectedGarment.price.toLocaleString()}{" "}
                    {selectedGarment.currency}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedGarment.colors.slice(0, 3).map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 text-[10px] rounded-full bg-background"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <Row label="Subtotal" value={`$${selectedGarment.price.toLocaleString()}`} />
                <Row label="Shipping" value="Free" muted />
                <Row label="Tax (est.)" value={`$${Math.round(selectedGarment.price * 0.08).toLocaleString()}`} muted />
                <div className="pt-2 border-t border-border flex justify-between font-medium">
                  <span>Total</span>
                  <span>
                    ${Math.round(selectedGarment.price * 1.08).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Size</label>
                <div className="flex gap-2">
                  {selectedGarment.sizes.map((s) => (
                    <button
                      key={s}
                      className="px-3 py-1.5 text-xs font-medium rounded-full border border-border hover:bg-foreground/5 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setPurchaseOpen(false);
                  toast.success("Order placed! Confirmation sent to your email.");
                }}
                className="w-full py-3 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Place Order — ${Math.round(selectedGarment.price * 1.08).toLocaleString()}
              </button>
              <p className="text-[11px] text-muted-foreground text-center">
                This is a demo experience. No payment will be processed.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Share modal */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Share your look</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-3">
            {[
              { id: "copy", label: "Copy", icon: Link2, action: () => handleShare("copy") },
              { id: "twitter", label: "X", icon: Twitter, action: () => handleShare("Twitter") },
              { id: "facebook", label: "Facebook", icon: Facebook, action: () => handleShare("Facebook") },
              { id: "mail", label: "Email", icon: Mail, action: () => handleShare("Email") },
            ].map((s) => (
              <button
                key={s.id}
                onClick={s.action}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-foreground/5 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center">
                  <s.icon className="w-5 h-5" />
                </div>
                <span className="text-xs">{s.label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => handleShare()}
            className="mt-2 w-full py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Share via device…
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ActionButton({
  onClick,
  disabled,
  icon: Icon,
  label,
  accent,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: typeof Download;
  label: string;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all flex-shrink-0",
        disabled
          ? "text-muted-foreground cursor-not-allowed"
          : accent
          ? "bg-champagne/20 text-foreground"
          : "hover:bg-foreground/5 text-foreground"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className={cn(muted ? "text-muted-foreground" : "text-foreground/80")}>
        {label}
      </span>
      <span className={cn(muted ? "text-muted-foreground" : "")}>{value}</span>
    </div>
  );
}
