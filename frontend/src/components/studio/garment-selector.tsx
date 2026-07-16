"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Check, Shirt, Upload, Store, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProducts } from "@/lib/api/products";
import { productToGarment } from "@/lib/api/mapping";
import { useDesigners } from "@/lib/api/designers";
import { useStudioStore } from "@/lib/store";
import type { Garment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PhotoUploader } from "./photo-uploader";

type Tab = "marketplace" | "upload" | "designer";

interface GarmentSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_FILE_MB = 8;

async function readGarmentFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    throw new Error(`Image must be under ${MAX_FILE_MB}MB.`);
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

export function GarmentSelector({ open, onOpenChange }: GarmentSelectorProps) {
  const [tab, setTab] = useState<Tab>("marketplace");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [designerFilter, setDesignerFilter] = useState<string>("all");
  const {
    selectedGarment,
    setSelectedGarment,
    customGarmentImage,
    setCustomGarmentImage,
    setGarmentSource,
    setView,
  } = useStudioStore();

  const { data: products = [], isLoading } = useProducts();
  const { data: designers = [] } = useDesigners();

  const filteredGarments: Garment[] = products
    .map(productToGarment)
    .filter((g) => {
      if (category !== "all" && g.category !== category) return false;
      if (designerFilter !== "all" && g.designerId !== designerFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !g.name.toLowerCase().includes(q) &&
          !g.designer.toLowerCase().includes(q) &&
          !g.tags.some((t) => t.includes(q))
        ) {
          return false;
        }
      }
      return true;
    });

  const handleSelectGarment = (g: Garment) => {
    setSelectedGarment(g);
    setCustomGarmentImage(null);
    setGarmentSource("marketplace");
    toast.success(`${g.name} selected.`);
    onOpenChange(false);
  };

  const handleUploadGarment = (img: string | null) => {
    setCustomGarmentImage(img);
    if (img) {
      setSelectedGarment(null);
      setGarmentSource("upload");
      toast.success("Garment image uploaded.");
      onOpenChange(false);
    }
  };

  const handleSelectDesigner = (designerId: string) => {
    setDesignerFilter(designerId);
    setTab("marketplace");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 border-b border-border">
          <DialogTitle className="font-serif text-2xl">Choose a Garment</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-border flex items-center gap-1">
          {[
            { id: "marketplace" as const, label: "Marketplace", icon: Store },
            { id: "upload" as const, label: "Upload Image", icon: Upload },
            { id: "designer" as const, label: "Designers", icon: User },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors",
                tab === t.id
                  ? "text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="garment-tab-pill"
                  className="absolute inset-0 rounded-full bg-foreground"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <t.icon className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* MARKETPLACE */}
            {tab === "marketplace" && (
              <motion.div
                key="marketplace"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full flex flex-col"
              >
                {/* Filters */}
                <div className="px-6 py-3 flex flex-col sm:flex-row gap-3 sm:items-center border-b border-border">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search garments, designers…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground/10"
                    />
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar -mx-1 px-1">
                    {[
                      { id: "all", label: "All" },
                      { id: "dresses", label: "Dresses" },
                      { id: "tops", label: "Tops" },
                      { id: "outerwear", label: "Outerwear" },
                      { id: "bottoms", label: "Bottoms" },
                      { id: "knitwear", label: "Knitwear" },
                    ].map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setCategory(c.id)}
                        className={cn(
                          "px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors",
                          category === c.id
                            ? "bg-foreground text-background"
                            : "bg-muted text-foreground/70 hover:bg-foreground/10"
                        )}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                  {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                      <Shirt className="w-10 h-10 mb-3 opacity-40" />
                      <p className="text-sm">Loading garments…</p>
                    </div>
                  ) : filteredGarments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                      <Shirt className="w-10 h-10 mb-3 opacity-40" />
                      <p className="text-sm">No garments match your filters.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredGarments.map((g, i) => {
                        const isSelected = selectedGarment?.id === g.id;
                        return (
                          <motion.button
                            key={g.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.02 }}
                            onClick={() => handleSelectGarment(g)}
                            className="group text-left"
                          >
                            <div
                              className={cn(
                                "relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all",
                                isSelected
                                  ? "border-champagne"
                                  : "border-transparent group-hover:border-border"
                              )}
                            >
                              <img
                                src={g.image}
                                alt={g.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-champagne flex items-center justify-center">
                                  <Check className="w-3.5 h-3.5 text-foreground" strokeWidth={3} />
                                </div>
                              )}
                              {g.featured && (
                                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full glass-strong text-[10px] font-medium">
                                  Featured
                                </div>
                              )}
                            </div>
                            <div className="mt-2">
                              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                                {g.designer}
                              </div>
                              <div className="text-sm font-medium truncate">{g.name}</div>
                              <div className="text-sm text-foreground/80 mt-0.5">
                                ${g.price.toLocaleString()}
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* UPLOAD */}
            {tab === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-y-auto p-6"
              >
                <div className="max-w-2xl mx-auto">
                  <div className="mb-6 p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Tips for best results:</strong>{" "}
                    Use a clear product photo of the garment on a clean
                    background. Flat-lay or ghost-mannequin shots work best. The
                    AI will analyze the fabric, fit, and details to dress your
                    photo realistically.
                  </div>
                  <PhotoUploader
                    label="Garment Image"
                    description="Upload a clear photo of the clothing you want to try on."
                    image={customGarmentImage}
                    onImage={handleUploadGarment}
                    emptyIcon={Shirt}
                    emptyHint="Drag a garment photo here, or upload one"
                    captureFacing="environment"
                    accentColor=""
                  />
                </div>
              </motion.div>
            )}

            {/* DESIGNER */}
            {tab === "designer" && (
              <motion.div
                key="designer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-y-auto p-6"
              >
                  <div className="grid sm:grid-cols-2 gap-4">
                  {designers.map((d, i) => (
                    <motion.button
                      key={d.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleSelectDesigner(d.id)}
                      className="group text-left rounded-2xl overflow-hidden border border-border hover:shadow-premium transition-all"
                    >
                      <div className="relative h-32 overflow-hidden">
                        <img
                          src={d.coverImage}
                          alt={d.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="font-serif text-lg text-background">
                            {d.name}
                          </div>
                          <div className="text-xs text-background/80 italic">
                            {d.tagline}
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span>{d.location}</span>
                          <span>·</span>
                          <span>{d.collectionCount} pieces</span>
                          <span>·</span>
                          <span>★ {d.rating}</span>
                        </div>
                        <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
                          {d.bio}
                        </p>
                        <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-foreground group-hover:gap-2 transition-all">
                          View collection
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer — view marketplace link */}
        {tab === "marketplace" && (
          <div className="border-t border-border px-6 py-3 flex items-center justify-between bg-muted/30">
            <div className="text-xs text-muted-foreground">
              {filteredGarments.length} garment
              {filteredGarments.length !== 1 ? "s" : ""} available
            </div>
            <button
              onClick={() => {
                onOpenChange(false);
                setView("marketplace");
              }}
              className="text-xs font-medium hover:underline"
            >
              Browse full marketplace →
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
