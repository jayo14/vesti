"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shirt,
  ShoppingBag,
  Heart,
  ChevronLeft,
  ChevronRight,
  Truck,
  RotateCcw,
  MapPin,
  Check,
  Sparkles,
  Plus,
  Minus,
  Share2,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { useStudioStore } from "@/lib/store";
import { useProductActions } from "@/lib/use-product-actions";
import { getMaterial } from "@/lib/materials";
import { useProduct, useProducts } from "@/lib/api/products";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { StarRating } from "@/components/shopping/star-rating";
import { AvailabilityBadge, PriceTag } from "@/components/shopping/availability-badge";
import { AIStylingSuggestions } from "@/components/shopping/ai-styling-suggestions";
import { ReviewsList } from "@/components/shopping/reviews-list";
import { CheckoutDialog } from "@/components/shopping/checkout-dialog";
import { ProductCard } from "@/components/shopping/product-card";

const EASE = [0.22, 1, 0.36, 1] as const;

type Tab = "description" | "styling" | "reviews" | "shipping";

export function ProductPageSection({ productId }: { productId: string }) {
  const router = useRouter();
  const { checkoutItem, addToCartItem, buyNow, tryOn } = useProductActions();
  const { data: product, isLoading } = useProduct(productId);
  const { data: allProducts = [] } = useProducts();

  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes.find((s) => s.inStock)?.label || ""
  );
  const [selectedColor, setSelectedColor] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<Tab>("description");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const openCheckout = () => {
    buyNow(product, { selectedSize, selectedColor, qty });
    setCheckoutOpen(true);
  };

  const share = async () => {
    const url = `${window.location.origin}/?product=${product.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Product link copied to clipboard.");
    } catch {
      toast.error("Could not copy link.");
    }
  };

  const relatedProducts = product
    ? allProducts
        .filter(
          (p) =>
            p.id !== product.id &&
            (p.category === product.category || p.sellerId === product.sellerId)
        )
        .slice(0, 4)
    : [];
  const isSoldOut = product ? product.availability === "sold-out" : false;
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "description", label: "Details" },
    { id: "styling", label: "AI Styling" },
    { id: "reviews", label: "Reviews", count: product?.reviews.length || 0 },
    { id: "shipping", label: "Shipping" },
  ];

  if (!product) {
    return (
      <section className="relative min-h-screen pt-24 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-muted-foreground py-20">
          {isLoading ? "Loading product…" : "Product not found."}
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push("/marketplace")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to marketplace
        </button>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* LEFT: Image gallery */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-muted">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImage}
                  src={product.images[activeImage]?.url}
                  alt={product.images[activeImage]?.alt || product.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </AnimatePresence>

              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage((i) => (i - 1 + product.images.length) % product.images.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-strong flex items-center justify-center hover:scale-105 transition-transform"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveImage((i) => (i + 1) % product.images.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-strong flex items-center justify-center hover:scale-105 transition-transform"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
                {product.featured && (
                  <span className="px-2.5 py-1 rounded-full glass-strong text-[10px] font-medium inline-flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-champagne" /> Featured
                  </span>
                )}
                {product.originalPrice && (
                  <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-medium">Sale</span>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="absolute bottom-4 right-4 px-2.5 py-1 rounded-full glass-strong text-[10px] font-medium">
                  {activeImage + 1} / {product.images.length}
                </div>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-2 mt-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "w-16 rounded-xl overflow-hidden border-2 transition-all aspect-[3/4]",
                      activeImage === i ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="space-y-5">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                <button onClick={() => router.push("/marketplace")} className="hover:text-foreground">{product.sellerName}</button>
                <span className="text-champagne">✓ Verified Seller</span>
              </div>
              <h1 className="font-serif text-4xl lg:text-5xl font-medium tracking-[-0.02em] leading-tight">{product.name}</h1>
              <div className="flex items-center gap-3 mt-3">
                <StarRating rating={product.rating} size="sm" showNumber reviewCount={product.reviews.length} />
                <span className="text-xs text-muted-foreground">·</span>
                <AvailabilityBadge product={product} variant="solid" />
              </div>
            </div>

            <div>
              <PriceTag price={product.price} originalPrice={product.originalPrice} size="lg" />
              {product.availability === "preorder" && <p className="text-xs text-blue-600 mt-1">Preorder — {product.shipsWithin}</p>}
              {product.stockCount > 0 && product.stockCount <= 5 && (
                <p className="text-xs text-amber-600 mt-1">Only {product.stockCount} left in stock</p>
              )}
            </div>

            <p className="text-sm text-foreground/80 leading-relaxed">{product.description}</p>

            {product.material && (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-muted/60">
                <span
                  className="w-4 h-4 rounded-full ring-1 ring-inset ring-black/10"
                  style={{ background: getMaterial(product.material)?.swatchPattern || getMaterial(product.material)?.swatch }}
                />
                <span className="text-xs font-medium">{getMaterial(product.material)?.name}</span>
                <span className="text-[10px] text-muted-foreground">· {getMaterial(product.material)?.origin}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium">Color: <span className="text-foreground">{product.colors[selectedColor]?.name}</span></label>
                <button onClick={share} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c, i) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedColor(i)}
                    title={c.name}
                    className={cn(
                      "relative w-9 h-9 rounded-full ring-1 ring-inset ring-black/10 transition-all",
                      selectedColor === i ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "hover:scale-110"
                    )}
                    style={{ backgroundColor: c.hex }}
                  >
                    {selectedColor === i && <Check className="absolute inset-0 m-auto w-3.5 h-3.5 text-white drop-shadow" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium">Size: <span className="text-foreground">{selectedSize || "Select"}</span></label>
                <button className="text-[11px] text-muted-foreground hover:text-foreground underline">Size guide</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {product.sizes.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => s.inStock && setSelectedSize(s.label)}
                    disabled={!s.inStock}
                    className={cn(
                      "min-w-[44px] px-3 py-2 text-xs font-medium rounded-xl border transition-all",
                      !s.inStock
                        ? "border-border text-muted-foreground/40 line-through cursor-not-allowed bg-muted/20"
                        : selectedSize === s.label
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground/40"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center border border-border rounded-full">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center hover:bg-foreground/5 rounded-l-full" aria-label="Decrease quantity">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-medium">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="w-9 h-9 flex items-center justify-center hover:bg-foreground/5 rounded-r-full" aria-label="Increase quantity">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={() => addToCartItem(product, { selectedSize, selectedColor, qty })}
                disabled={isSoldOut}
                className="flex-1 py-3.5 rounded-full border border-foreground text-sm font-medium hover:bg-foreground/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" /> Add to bag
              </button>
              <button
                onClick={() => setWishlisted((w) => !w)}
                className={cn(
                  "w-12 h-12 shrink-0 rounded-full border flex items-center justify-center transition-colors",
                  wishlisted ? "border-red-500 text-red-500 bg-red-500/5" : "border-border hover:bg-foreground/5"
                )}
                aria-label="Save to wishlist"
              >
                <Heart className={cn("w-4 h-4", wishlisted && "fill-current")} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => tryOn(product)}
                disabled={isSoldOut}
                className="flex-1 py-3.5 rounded-full border border-border text-sm font-medium hover:bg-foreground/5 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                <Shirt className="w-4 h-4" /> Virtual Try-On
              </button>
              <button
                onClick={openCheckout}
                disabled={isSoldOut}
                className={cn(
                  "flex-1 py-3.5 rounded-full text-sm font-medium transition-all inline-flex items-center justify-center gap-2",
                  isSoldOut ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-foreground text-background hover:opacity-90"
                )}
              >
                Buy Now · ${(product.price * qty).toLocaleString()}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-center">
              <InfoBit icon={Truck} label="Ships from" value={product.shipsFrom} />
              <InfoBit icon={MapPin} label="Delivery" value={product.shipsWithin} />
              <InfoBit icon={RotateCcw} label="Returns" value={product.returns} />
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-1 border-b border-border overflow-x-auto no-scrollbar">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "relative px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors",
                      tab === t.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t.label}
                    {typeof t.count === "number" && <span className="ml-1 text-[10px] text-muted-foreground">({t.count})</span>}
                    {tab === t.id && <motion.span layoutId="product-page-tab" className="absolute bottom-0 inset-x-0 h-0.5 bg-foreground" />}
                  </button>
                ))}
              </div>
              <div className="pt-5 pb-2">
                <AnimatePresence mode="wait">
                  <motion.div key={tab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>
                    {tab === "description" && (
                      <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
                        <p>{product.description}</p>
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          {product.tags.map((tag) => (
                            <div key={tag} className="text-[11px] px-2 py-1 rounded-full bg-muted text-foreground/70 text-center">#{tag}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {tab === "styling" && <AIStylingSuggestions product={product} />}
                    {tab === "reviews" && <ReviewsList product={product} />}
                    {tab === "shipping" && (
                      <div className="space-y-3 text-sm">
                        <ShippingRow icon={Truck} label="Ships from" value={product.shipsFrom} />
                        <ShippingRow icon={MapPin} label="Estimated delivery" value={product.shipsWithin} />
                        <ShippingRow icon={RotateCcw} label="Returns" value={product.returns} />
                        <div className="p-3 rounded-xl bg-muted/40 text-xs text-foreground/70">
                          All orders ship with tracking and insurance. Duties and taxes may apply for international shipments. This is a demo store — no real order will be fulfilled.
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-16 border-t border-border pt-10">
            <h3 className="font-serif text-2xl mb-5">You might also like</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} onOpen={(prod) => router.push(`/marketplace/${prod.id}`)} onTryOn={(prod) => {
                  const store = useStudioStore.getState();
                  store.setSelectedGarment({
                    id: prod.id, name: prod.name, designer: prod.sellerName, designerId: prod.sellerId,
                    category: prod.category, price: prod.price, currency: prod.currency,
                    image: prod.images?.[0]?.url || prod.image, description: prod.description,
                    colors: prod.colors.map((c) => c.name), sizes: prod.sizes.map((s) => s.label),
                    tags: prod.tags, featured: prod.featured, inStock: prod.availability !== "sold-out",
                    material: prod.material,
                  });
                  store.setCustomGarmentImage(null);
                  store.setGarmentSource("marketplace");
                  if (prod.material) store.setSelectedMaterial(prod.material);
                  router.push("/try-on");
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} singleItem={checkoutItem || undefined} />
    </section>
  );
}

function InfoBit({ icon: Icon, label, value }: { icon: typeof Truck; label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-xl bg-muted/40 text-center">
      <Icon className="w-3.5 h-3.5 mx-auto mb-1 text-foreground/60" />
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-[10px] font-medium leading-tight mt-0.5 line-clamp-2">{value}</div>
    </div>
  );
}

function ShippingRow({ icon: Icon, label, value }: { icon: typeof Truck; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
      <Icon className="w-4 h-4 mt-0.5 text-foreground/60 flex-shrink-0" />
      <div className="flex-1">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}
