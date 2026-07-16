"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Trash2,
  Download,
  ShoppingBag,
  Heart,
  ArrowRight,
  Clock,
  Wand2,
  Shirt,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useStudioStore } from "@/lib/store";
import { useWardrobeStore } from "@/lib/wardrobe-store";
import { getMaterial } from "@/lib/materials";
import { ComparisonViewer } from "@/components/studio/comparison-viewer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SavedLook, Product } from "@/lib/types";
import { toast } from "sonner";
import { WardrobeUploader } from "@/components/wardrobe/wardrobe-uploader";
import { WardrobeGrid } from "@/components/wardrobe/wardrobe-grid";
import { OutfitRecommender } from "@/components/wardrobe/outfit-recommender";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

type Tab = "looks" | "wardrobe" | "outfits";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function WardrobeSection() {
  const router = useRouter();
  const { savedLooks, deleteLook, startPlayground } = useStudioStore();
  const { items } = useWardrobeStore();
  const [tab, setTab] = useState<Tab>("looks");
  const [viewing, setViewing] = useState<SavedLook | null>(null);
  // For opening marketplace products from outfit suggestions
  const [openProduct, setOpenProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleDownload = (look: SavedLook) => {
    const a = document.createElement("a");
    a.href = look.resultImage;
    a.download = `look-${look.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Look downloaded.");
  };

  const handleDelete = (id: string) => {
    deleteLook(id);
    if (viewing?.id === id) setViewing(null);
    toast.success("Look removed from wardrobe.");
  };

  const handleOpenProduct = (p: Product) => {
    setOpenProduct(p);
    setDetailOpen(true);
  };

  const tabs: { id: Tab; label: string; icon: typeof Heart; count: number }[] = [
    { id: "looks", label: "My Looks", icon: Heart, count: savedLooks.length },
    { id: "wardrobe", label: "Digital Wardrobe", icon: Shirt, count: items.length },
    { id: "outfits", label: "Outfit Ideas", icon: Wand2, count: 0 },
  ];

  return (
    <section className="relative min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium text-foreground/70 mb-4">
            <Heart className="w-3.5 h-3.5 text-champagne" />
            <span>Your Personal Wardrobe</span>
          </div>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium tracking-[-0.02em]">
                Your wardrobe
              </h2>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl">
                Browse your saved AI try-on looks, upload clothes you already
                own, and let AI recommend complete outfits for any occasion.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tab switcher */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
          className="mb-6 flex items-center gap-1 p-1 rounded-full bg-muted w-fit max-w-full overflow-x-auto no-scrollbar"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap",
                tab === t.id
                  ? "text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === t.id && (
                <motion.span
                  layoutId="wardrobe-tab-pill"
                  className="absolute inset-0 rounded-full bg-foreground"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <t.icon className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">{t.label}</span>
              {t.count > 0 && (
                <span
                  className={cn(
                    "relative z-10 ml-1 text-[10px] px-1.5 py-0.5 rounded-full",
                    tab === t.id ? "bg-background/20" : "bg-foreground/10"
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* === TAB: MY LOOKS === */}
            {tab === "looks" && (
              <div>
                {savedLooks.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
                    className="py-20 text-center"
                  >
                    <div className="w-20 h-20 rounded-3xl bg-foreground/5 mx-auto mb-6 flex items-center justify-center">
                      <Sparkles className="w-9 h-9 text-foreground/40" />
                    </div>
                    <h3 className="font-serif text-2xl mb-2">No looks saved yet</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                      Head to the studio, generate your first AI try-on, and save it
                      to see it here.
                    </p>
                    <button
                      onClick={() => router.push("/try-on")}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      Open Studio <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {savedLooks.map((look, i) => (
                      <motion.article
                        key={look.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: EASE, delay: i * 0.05 }}
                        layout
                        className="group"
                      >
                        <div
                          className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted mb-3 cursor-pointer"
                          onClick={() => setViewing(look)}
                        >
                          <img
                            src={look.resultImage}
                            alt={`${look.garmentName} look`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                            <span className="text-background text-xs font-medium">
                              View look
                            </span>
                          </div>
                          <div className="absolute top-2 right-2 flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(look);
                              }}
                              className="w-7 h-7 rounded-full glass-strong flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                              aria-label="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(look.id);
                              }}
                              className="w-7 h-7 rounded-full glass-strong flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                              aria-label="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {look.designerName}
                          </div>
                          <div className="text-sm font-medium leading-tight line-clamp-1">
                            {look.garmentName}
                          </div>
                          {look.material && (
                            <div className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                              <span
                                className="w-2.5 h-2.5 rounded-full ring-1 ring-inset ring-black/10"
                                style={{
                                  background:
                                    getMaterial(look.material)?.swatchPattern ||
                                    getMaterial(look.material)?.swatch,
                                }}
                              />
                              {getMaterial(look.material)?.name}
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeAgo(look.createdAt)}
                            </span>
                            {look.price > 0 && (
                              <span className="text-xs font-medium">
                                ${look.price.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* === TAB: DIGITAL WARDROBE === */}
            {tab === "wardrobe" && (
              <div className="space-y-6">
                <WardrobeUploader />
                <WardrobeGrid />
              </div>
            )}

            {/* === TAB: OUTFIT IDEAS === */}
            {tab === "outfits" && (
              <div className="grid lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5">
                  <OutfitRecommender onOpenProduct={handleOpenProduct} />
                </div>
                <div className="lg:col-span-7">
                  <div className="p-5 rounded-3xl border border-border bg-gradient-to-br from-champagne-muted/30 to-transparent">
                    <div className="flex items-center gap-2 mb-3">
                      <Wand2 className="w-4 h-4 text-champagne" />
                      <h3 className="font-serif text-lg font-medium">
                        How AI outfit recommendations work
                      </h3>
                    </div>
                    <ol className="space-y-3 text-sm text-foreground/80">
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-foreground text-background text-xs font-medium flex items-center justify-center">
                          1
                        </span>
                        <span className="leading-relaxed pt-0.5">
                          Upload photos of clothes you own to the{" "}
                          <button
                            onClick={() => setTab("wardrobe")}
                            className="font-medium underline"
                          >
                            Digital Wardrobe
                          </button>{" "}
                          tab. AI auto-categorizes each item.
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-foreground text-background text-xs font-medium flex items-center justify-center">
                          2
                        </span>
                        <span className="leading-relaxed pt-0.5">
                          Describe your occasion, pick the weather, time of day,
                          and dress code on the left.
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-foreground text-background text-xs font-medium flex items-center justify-center">
                          3
                        </span>
                        <span className="leading-relaxed pt-0.5">
                          AI composes 2-3 complete outfits from your wardrobe,
                          suggesting marketplace items only to fill gaps.
                        </span>
                      </li>
                    </ol>
                    <div className="mt-4 p-3 rounded-xl bg-background/50 text-xs text-muted-foreground">
                      <strong className="text-foreground">Tip:</strong> The more
                      varied your wardrobe (different categories, colors, and
                      styles), the better the recommendations. Aim for at least
                      one item in each of shirts, trousers, jackets, and shoes.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Look viewer modal */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-3 border-b border-border">
            <DialogTitle className="font-serif text-xl">
              {viewing?.garmentName}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {viewing?.designerName}
              {viewing && viewing.price > 0
                ? ` · $${viewing.price.toLocaleString()}`
                : ""}
            </p>
          </DialogHeader>
          <div className="flex-1 p-6 overflow-hidden h-[calc(85vh-100px)]">
            {viewing && (
              <ComparisonViewer
                beforeImage={viewing.personImage}
                afterImage={viewing.resultImage}
                beforeLabel="Original"
                afterLabel="AI Look"
              />
            )}
          </div>
          <div className="border-t border-border p-4 flex items-center justify-end gap-2">
            <button
              onClick={() => viewing && handleDownload(viewing)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm font-medium hover:bg-foreground/5 transition-colors"
            >
              <Download className="w-4 h-4" /> Download
            </button>
            <button
              onClick={() => {
                if (!viewing) return;
                startPlayground(viewing.resultImage);
                setViewing(null);
                router.push("/playground");
                toast.success("Loaded into the Playground.");
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm font-medium hover:bg-foreground/5 transition-colors"
            >
              <Wand2 className="w-4 h-4" /> Edit in Playground
            </button>
            <button
              onClick={() => {
                setViewing(null);
                router.push("/marketplace");
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <ShoppingBag className="w-4 h-4" /> Shop similar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product detail dialog (for outfit suggestion products) */}
      <ProductDetailLazy
        product={openProduct}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onOpenProduct={setOpenProduct}
      />
    </section>
  );
}

// Lazy wrapper so we don't import the heavy ProductDetailDialog unless needed
import { ProductDetailDialog } from "@/components/shopping/product-detail-dialog";
function ProductDetailLazy(props: {
  product: Product | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onOpenProduct: (p: Product) => void;
}) {
  return <ProductDetailDialog {...props} />;
}
