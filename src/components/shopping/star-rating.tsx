"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  size?: "xs" | "sm" | "md" | "lg";
  showNumber?: boolean;
  reviewCount?: number;
  className?: string;
}

const SIZE_MAP = {
  xs: "w-3 h-3",
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

export function StarRating({
  rating,
  size = "sm",
  showNumber = false,
  reviewCount,
  className,
}: StarRatingProps) {
  const sizeClass = SIZE_MAP[size];
  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <div className="inline-flex items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = rating >= star;
          const half = !filled && rating >= star - 0.5;
          return (
            <span key={star} className="relative inline-block">
              <Star
                className={cn(sizeClass, "text-muted-foreground/30")}
                fill="currentColor"
              />
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: half ? "50%" : "100%" }}
                >
                  <Star
                    className={cn(sizeClass, "text-amber-500")}
                    fill="currentColor"
                  />
                </span>
              )}
            </span>
          );
        })}
      </div>
      {showNumber && (
        <span className="text-xs font-medium text-foreground/80">
          {rating.toFixed(1)}
          {typeof reviewCount === "number" && (
            <span className="text-muted-foreground ml-1">
              ({reviewCount})
            </span>
          )}
        </span>
      )}
    </div>
  );
}
