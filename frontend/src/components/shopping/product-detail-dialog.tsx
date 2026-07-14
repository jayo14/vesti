"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
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
  Star,
  Plus,
  Minus,
} from "lucide-react";
import type { Product, CheckoutItem } from "@/lib/types";
import { useStudioStore } from "@/lib/store";
import { useShoppingStore } from "@/lib/shopping-store";
import { getMaterial } from "@/lib/materials";
import { getRelatedProducts } from "@/lib/products";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { StarRating } from "./star-rating";
import { AvailabilityBadge, PriceTag } from "./availability-badge";
import { AIStylingSuggestions } from "./ai-styling-suggestions";
import { ReviewsList } from "./reviews-list";
import { CheckoutDialog } from "./checkout-dialog";
import { ProductCard } from "./product-card";

interface ProductDetailDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onOpenProduct: (p: Product) => void;
}

type Tab = "description" | "styling" | "reviews" | "shipping";

export function ProductDetailDialog({
  product,
  open,
  onOpenChange,
  onOpenProduct,
}: ProductDetailDialogProps) {
  // Use product.id as a key on the inner content so React remounts it (and
  // resets all internal state) whenever the user opens a different product.
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
          {product && (
            <ProductDetailContent
              key={product.id}
              product={product}
              onOpenChange={onOpenChange}
              onOpenProduct={onOpenProduct}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ProductDetailContent({
  product,
  onOpenChange,
  onOpenProduct,
}: {
  product: Product;
  onOpenChange: (o: boolean) => void;
  onOpenProduct: (p: Product) => void;
}) {
  const { setView, setSelectedGarment, setCustomGarmentImage, setGarmentSource, setSelectedMaterial } = useStudioStore();
  const { addToCart } = useShoppingStore();

  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes.find((s) => s.inStock)?.label || ""
  );
  const [selectedColor, setSelectedColor] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<Tab>("description");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [buyNowItem, setBuyNowItem] = useState<CheckoutItem | null>(null);

  const handleTryOn = () => {
    // Map product → garment for the existing Studio flow
    setSelectedGarment({
      id: product.id,
      name: product.name,
      designer: product.sellerName,
      designerId: product.sellerId,
      category: product.category,
      price: product.price,
      currency: product.currency,
      image: product.images[0]?.url || product.image,
      description: product.description,
      colors: product.colors.map((c) => c.name),
      sizes: product.sizes.map((s) => s.label),
      tags: product.tags,
      featured: product.featured,
      inStock: product.availability !== "sold-out",
      material: product.material,
    });
    setCustomGarmentImage(null);
    setGarmentSource("marketplace");
    if (product.material) setSelectedMaterial(product.material);
    onOpenChange(false);
    setView("studio");
    toast.success(`${product.name} loaded into the Studio.`);
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size.");
      return;
    }
    const item = {
      productId: product.id,
      name: product.name,
      image: product.images[0]?.url || product.image,
      size: selectedSize,
      color: product.colors[selectedColor]?.name || "",
      price: product.price,
      quantity: qty,
      sellerName: product.sellerName,
    };
    addToCart(item);
    toast.success(`Added ${product.name} to bag.`);
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      toast.error("Please select a size.");
      return;
    }
    setBuyNowItem({
      productId: product.id,
      name: product.name,
      image: product.images[0]?.url || product.image,
      size: selectedSize,
      color: product.colors[selectedColor]?.name || "",
      price: product.price,
      quantity: qty,
    });
    setCheckoutOpen(true);
  };

  const relatedProducts = getRelatedProducts(product.id, 4);
  const isSoldOut = product.availability === "sold-out";
  const selectedSizeObj = product.sizes.find((s) => s.label === selectedSize);
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "description", label: "Details" },
    { id: "styling", label: "AI Styling" },
    { id: "reviews", label: "Reviews", count: product.reviews.length },
    { id: "shipping", label: "Shipping" },
  ];

  return (
    <>
      <div className="flex-1 overflow-y-auto">
            <div className="grid lg:grid-cols-2 gap-0">
              {/* LEFT: Image carousel */}
              <div className="bg-muted/30 p-4 sm:p-6 lg:p-8 sticky top-0 lg:h-[90vh] lg:overflow-y-auto">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted mb-3 max-h-[60vh] mx-auto">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeImage}
                      src={product.images[activeImage]?.url}
                      alt={product.images[activeImage]?.alt || product.name}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </AnimatePresence>

                  {/* Carousel arrows */}
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setActiveImage((i) => (i - 1 + product.images.length) % product.images.length)
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full glass-strong flex items-center justify-center hover:scale-105 transition-transform"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setActiveImage((i) => (i + 1) % product.images.length)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full glass-strong flex items-center justify-center hover:scale-105 transition-transform"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* Image counter */}
                  {product.images.length > 1 && (
                    <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full glass-strong text-[10px] font-medium">
                      {activeImage + 1} / {product.images.length}
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                    {product.featured && (
                      <span className="px-2 py-0.5 rounded-full glass-strong text-[10px] font-medium inline-flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-champagne" />
                        Featured
                      </span>
                    )}
                    {product.originalPrice && (
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-medium">
                        Sale
                      </span>
                    )}
                  </div>
                </div>

                {/* Thumbnails */}
                {product.images.length > 1 && (
                  <div className="flex gap-2 justify-center">
                    {product.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className={cn(
                          "w-14 h-18 rounded-lg overflow-hidden border-2 transition-all aspect-[3/4]",
                          activeImage === i
                            ? "border-foreground"
                            : "border-transparent opacity-60 hover:opacity-100"
                        )}
                      >
                        <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT: Product info + actions */}
              <div className="p-4 sm:p-6 lg:p-8 space-y-4">
                {/* Seller + name */}
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                    <span>{product.sellerName}</span>
                    <span className="text-champagne">✓ Verified Seller</span>
                  </div>
                  <h2 className="font-serif text-3xl lg:text-4xl font-medium tracking-[-0.02em] leading-tight">
                    {product.name}
                  </h2>
                  <div className="flex items-center gap-3 mt-2">
                    <StarRating
                      rating={product.rating}
                      size="sm"
                      showNumber
                      reviewCount={product.reviews.length}
                    />
                    <span className="text-xs text-muted-foreground">·</span>
                    <AvailabilityBadge product={product} variant="solid" />
                  </div>
                </div>

                {/* Price */}
                <div>
                  <PriceTag
                    price={product.price}
                    originalPrice={product.originalPrice}
                    size="lg"
                  />
                  {product.availability === "preorder" && (
                    <p className="text-xs text-blue-600 mt-1">
                      Preorder — {product.shipsWithin}
                    </p>
                  )}
                </div>

                {/* Description preview */}
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {product.description}
                </p>

                {/* Material badge */}
                {product.material && (
                  <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-muted/60">
                    <span
                      className="w-4 h-4 rounded-full ring-1 ring-inset ring-black/10"
                      style={{
                        background:
                          getMaterial(product.material)?.swatchPattern ||
                          getMaterial(product.material)?.swatch,
                      }}
                    />
                    <span className="text-xs font-medium">
                      {getMaterial(product.material)?.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      · {getMaterial(product.material)?.origin}
                    </span>
                  </div>
                )}

                {/* Color selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium">
                      Color: <span className="text-foreground">{product.colors[selectedColor]?.name}</span>
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((c, i) => (
                      <button
                        key={c.name}
                        onClick={() => setSelectedColor(i)}
                        title={c.name}
                        className={cn(
                          "relative w-9 h-9 rounded-full ring-1 ring-inset ring-black/10 transition-all",
                          selectedColor === i
                            ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                            : "hover:scale-110"
                        )}
                        style={{ backgroundColor: c.hex }}
                      >
                        {selectedColor === i && (
                          <Check
                            className="absolute inset-0 m-auto w-3.5 h-3.5 text-white drop-shadow"
                            strokeWidth={3}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium">
                      Size: <span className="text-foreground">{selectedSize || "Select"}</span>
                    </label>
                    <button className="text-[11px] text-muted-foreground hover:text-foreground underline">
                      Size guide
                    </button>
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

                {/* Quantity + Buy actions */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-border rounded-full">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 flex items-center justify-center hover:bg-foreground/5 rounded-l-full"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{qty}</span>
                    <button
                      onClick={() => setQty((q) => q + 1)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-foreground/5 rounded-r-full"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={isSoldOut}
                    className="flex-1 py-3 rounded-full border border-foreground text-sm font-medium hover:bg-foreground/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Add to bag
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTryOn}
                    disabled={isSoldOut}
                    className="flex-1 py-3 rounded-full border border-border text-sm font-medium hover:bg-foreground/5 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    <Shirt className="w-4 h-4" />
                    Virtual Try-On
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={isSoldOut}
                    className={cn(
                      "flex-1 py-3 rounded-full text-sm font-medium transition-all inline-flex items-center justify-center gap-2",
                      isSoldOut
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-foreground text-background hover:opacity-90"
                    )}
                  >
                    Buy Now · ${(product.price * qty).toLocaleString()}
                  </button>
                </div>

                {/* Shipping quick info */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                  <InfoBit icon={Truck} label="Ships from" value={product.shipsFrom} />
                  <InfoBit icon={MapPin} label="Delivery" value={product.shipsWithin} />
                  <InfoBit icon={RotateCcw} label="Returns" value={product.returns} />
                </div>

                {/* Tabs */}
                <div className="pt-4">
                  <div className="flex items-center gap-1 border-b border-border overflow-x-auto no-scrollbar">
                    {tabs.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={cn(
                          "relative px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors",
                          tab === t.id
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {t.label}
                        {typeof t.count === "number" && (
                          <span className="ml-1 text-[10px] text-muted-foreground">
                            ({t.count})
                          </span>
                        )}
                        {tab === t.id && (
                          <motion.span
                            layoutId="product-tab-indicator"
                            className="absolute bottom-0 inset-x-0 h-0.5 bg-foreground"
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 pb-2">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={tab}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        {tab === "description" && (
                          <div className="space-y-3 text-sm text-foreground/80 leading-relaxed">
                            <p>{product.description}</p>
                            <div className="grid grid-cols-2 gap-2 pt-2">
                              {product.tags.map((tag) => (
                                <div
                                  key={tag}
                                  className="text-[11px] px-2 py-1 rounded-full bg-muted text-foreground/70 text-center"
                                >
                                  #{tag}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {tab === "styling" && (
                          <AIStylingSuggestions product={product} />
                        )}

                        {tab === "reviews" && <ReviewsList product={product} />}

                        {tab === "shipping" && (
                          <div className="space-y-3 text-sm">
                            <ShippingRow
                              icon={Truck}
                              label="Ships from"
                              value={product.shipsFrom}
                            />
                            <ShippingRow
                              icon={MapPin}
                              label="Estimated delivery"
                              value={product.shipsWithin}
                            />
                            <ShippingRow
                              icon={RotateCcw}
                              label="Returns"
                              value={product.returns}
                            />
                            <div className="p-3 rounded-xl bg-muted/40 text-xs text-foreground/70">
                              All orders ship with tracking and insurance. Duties and
                              taxes may apply for international shipments. This is a
                              demo store — no real order will be fulfilled.
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {/* Related products */}
            {relatedProducts.length > 0 && (
              <div className="border-t border-border p-4 sm:p-6 lg:p-8">
                <h3 className="font-serif text-xl mb-4">You might also like</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {relatedProducts.map((p, i) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      index={i}
                      onOpen={onOpenProduct}
                      onTryOn={(prod) => {
                        onOpenProduct(prod);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        singleItem={buyNowItem || undefined}
      />
    </>
  );
}

function InfoBit({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Truck;
  label: string;
  value: string;
}) {
  return (
    <div className="p-2 rounded-xl bg-muted/40 text-center">
      <Icon className="w-3.5 h-3.5 mx-auto mb-1 text-foreground/60" />
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-[10px] font-medium leading-tight mt-0.5 line-clamp-2">
        {value}
      </div>
    </div>
  );
}

function ShippingRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Truck;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
      <Icon className="w-4 h-4 mt-0.5 text-foreground/60 flex-shrink-0" />
      <div className="flex-1">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}
