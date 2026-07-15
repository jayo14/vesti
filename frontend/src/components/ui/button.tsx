import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline" | "ghost";
type Size = "default" | "sm" | "lg";

const variantClasses: Record<Variant, string> = {
  default: "bg-brand-600 text-white hover:bg-brand-700",
  outline: "border border-neutral-300 text-neutral-700 hover:bg-neutral-100",
  ghost: "text-neutral-700 hover:bg-neutral-100",
};

const sizeClasses: Record<Size, string> = {
  default: "px-4 py-2 text-sm",
  sm: "px-3 py-1.5 text-sm",
  lg: "px-5 py-2.5 text-base",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
