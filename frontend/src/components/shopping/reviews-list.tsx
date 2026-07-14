"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Check,
  ThumbsUp,
  Plus,
  X,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import type { Product, ProductReview } from "@/lib/types";
import { useShoppingStore } from "@/lib/shopping-store";
import { StarRating } from "./star-rating";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ReviewsListProps {
  product: Product;
}

const FIT_LABELS: Record<NonNullable<ProductReview["fit"]>, string> = {
  "runs-small": "Runs small",
  "true-to-size": "True to size",
  "runs-large": "Runs large",
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const day = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (day < 1) return "today";
  if (day < 7) return `${day} day${day !== 1 ? "s" : ""} ago`;
  if (day < 30) return `${Math.floor(day / 7)} week${Math.floor(day / 7) !== 1 ? "s" : ""} ago`;
  if (day < 365) return `${Math.floor(day / 30)} month${Math.floor(day / 30) !== 1 ? "s" : ""} ago`;
  return `${Math.floor(day / 365)} year${Math.floor(day / 365) !== 1 ? "s" : ""} ago`;
}

export function ReviewsList({ product }: ReviewsListProps) {
  const { sessionReviews, addSessionReview } = useShoppingStore();
  const [formOpen, setFormOpen] = useState(false);
  const [helpfulMarked, setHelpfulMarked] = useState<Set<string>>(new Set());

  // Combine seed reviews with any session-added reviews
  const allReviews = [
    ...(sessionReviews[product.id] || []),
    ...product.reviews,
  ];

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = allReviews.filter((r) => Math.round(r.rating) === star).length;
    const pct = allReviews.length ? (count / allReviews.length) * 100 : 0;
    return { star, count, pct };
  });

  const markHelpful = (id: string) => {
    setHelpfulMarked((prev) => new Set(prev).add(id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-serif text-base font-medium">
          Reviews ({allReviews.length})
        </h4>
        <button
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" /> Write a review
        </button>
      </div>

      {/* Rating summary */}
      <div className="flex flex-col sm:flex-row gap-4 mb-5 p-4 rounded-2xl bg-muted/40">
        <div className="flex-shrink-0 text-center sm:text-left sm:pr-4 sm:border-r sm:border-border">
          <div className="font-serif text-4xl font-medium">
            {product.rating.toFixed(1)}
          </div>
          <StarRating rating={product.rating} size="sm" className="mt-1 justify-center sm:justify-start" />
          <div className="text-[11px] text-muted-foreground mt-1">
            {allReviews.length} review{allReviews.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="flex-1 space-y-1">
          {ratingBreakdown.map(({ star, count, pct }) => (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-muted-foreground">{star}</span>
              <Star className="w-3 h-3 text-amber-500" fill="currentColor" />
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-muted-foreground w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        {allReviews.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No reviews yet. Be the first to write one!
          </div>
        )}
        {allReviews.map((review) => (
          <ReviewItem
            key={review.id}
            review={review}
            helpfulMarked={helpfulMarked.has(review.id)}
            onMarkHelpful={() => markHelpful(review.id)}
          />
        ))}
      </div>

      <AnimatePresence>
        {formOpen && (
          <ReviewForm
            product={product}
            onClose={() => setFormOpen(false)}
            onSubmit={(review) => {
              addSessionReview(product.id, review);
              setFormOpen(false);
              toast.success("Thanks! Your review has been posted.");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ReviewItem({
  review,
  helpfulMarked,
  onMarkHelpful,
}: {
  review: ProductReview;
  helpfulMarked: boolean;
  onMarkHelpful: () => void;
}) {
  return (
    <div className="p-4 rounded-2xl border border-border bg-card">
      <div className="flex items-start gap-3">
        {review.avatar ? (
          <img
            src={review.avatar}
            alt={review.author}
            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0 text-xs font-medium">
            {review.author.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{review.author}</span>
            {review.verified && (
              <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                <Check className="w-2.5 h-2.5" />
                Verified
              </span>
            )}
            <span className="text-[11px] text-muted-foreground">
              · {timeAgo(review.createdAt)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <StarRating rating={review.rating} size="xs" />
            {review.fit && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-foreground/70">
                {FIT_LABELS[review.fit]}
              </span>
            )}
            {review.size && (
              <span className="text-[10px] text-muted-foreground">
                · Size: {review.size}
              </span>
            )}
          </div>
          <h5 className="font-medium text-sm mt-2">{review.title}</h5>
          <p className="text-sm text-foreground/80 leading-relaxed mt-1">
            {review.body}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={onMarkHelpful}
              disabled={helpfulMarked}
              className={cn(
                "inline-flex items-center gap-1 text-[11px] transition-colors",
                helpfulMarked
                  ? "text-champagne"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ThumbsUp className="w-3 h-3" />
              {helpfulMarked ? "Helpful" : "Mark helpful"}
              <span className="text-muted-foreground">
                ({review.helpful + (helpfulMarked ? 1 : 0)})
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewForm({
  product,
  onClose,
  onSubmit,
}: {
  product: Product;
  onClose: () => void;
  onSubmit: (review: ProductReview) => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [size, setSize] = useState<string>("");
  const [fit, setFit] = useState<ProductReview["fit"]>("true-to-size");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!author.trim() || !title.trim() || !body.trim() || rating === 0) {
      toast.error("Please fill in all fields and select a rating.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          author,
          rating,
          title,
          body,
          size: size || undefined,
          fit,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.review) {
        throw new Error(data.error || "Couldn't submit review.");
      }
      onSubmit(data.review as ProductReview);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-lg p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="bg-card w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-border shadow-premium-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card border-b border-border px-5 py-3 flex items-center justify-between">
          <h3 className="font-serif text-lg">Write a review</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-foreground/5 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="text-xs text-muted-foreground">
            Reviewing: <span className="font-medium text-foreground">{product.name}</span>
          </div>

          {/* Rating */}
          <div>
            <label className="text-xs font-medium mb-1.5 block">Your rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1"
                  aria-label={`Rate ${star} stars`}
                >
                  <Star
                    className={cn(
                      "w-6 h-6 transition-colors",
                      (hoverRating || rating) >= star
                        ? "text-amber-500"
                        : "text-muted-foreground/30"
                    )}
                    fill="currentColor"
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm font-medium">
                  {["", "Poor", "Fair", "Good", "Great", "Excellent"][rating]}
                </span>
              )}
            </div>
          </div>

          {/* Author */}
          <div>
            <label className="text-xs font-medium mb-1.5 block">Your name</label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Eleanor V."
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground/10"
            />
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium mb-1.5 block">Review title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground/10"
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-xs font-medium mb-1.5 block">Your review</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What did you love? What didn't work? How did it fit?"
              rows={4}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground/10 resize-none"
            />
          </div>

          {/* Size + fit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block">Size purchased</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground/10"
              >
                <option value="">— Select —</option>
                {product.sizes.map((s) => (
                  <option key={s.label} value={s.label}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">Fit</label>
              <select
                value={fit}
                onChange={(e) => setFit(e.target.value as ProductReview["fit"])}
                className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground/10"
              >
                <option value="runs-small">Runs small</option>
                <option value="true-to-size">True to size</option>
                <option value="runs-large">Runs large</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5" />
            Reviews are moderated. Your name will be displayed publicly.
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
              </>
            ) : (
              "Submit review"
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
