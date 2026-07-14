"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Shirt,
  ChevronUp,
  Triangle,
  Circle,
  AlignVerticalJustifyCenter,
  Pocket,
  Minus,
  Ruler,
  Flower2,
  Palette,
  Droplet,
  Sparkles,
  ChevronDown,
  Check,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import {
  EDITABLE_COMPONENTS,
  type EditableComponentSpec,
} from "@/lib/editable-components";
import { useStudioStore } from "@/lib/store";
import type { EditableComponent } from "@/lib/types";
import { useEdit } from "@/hooks/use-edit";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Shirt,
  ChevronUp,
  Triangle,
  Circle,
  AlignVerticalJustifyCenter,
  Pocket,
  Minus,
  Ruler,
  Flower2,
  Palette,
  Droplet,
  Sparkles,
};

interface ComponentControlPanelProps {
  /** Compact mode: render as horizontal scroll of icon buttons that expand inline. */
  compact?: boolean;
}

export function ComponentControlPanel({ compact = false }: ComponentControlPanelProps) {
  const { activeComponent, setActiveComponent } = useStudioStore();
  const [expanded, setExpanded] = useState<EditableComponent | null>(null);
  const { applyEdit, isEditing } = useEdit();

  const toggleExpand = (id: EditableComponent) => {
    setExpanded((cur) => (cur === id ? null : id));
    setActiveComponent(id);
  };

  return (
    <div className="flex flex-col h-full">
      {!compact && (
        <div className="px-4 pt-4 pb-2">
          <h3 className="font-serif text-base font-medium">Editable Components</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click any component to reveal presets and controls.
          </p>
        </div>
      )}

      <div
        className={cn(
          "flex-1 overflow-y-auto px-2 pb-3 space-y-1",
          compact && "flex gap-1 overflow-x-auto no-scrollbar"
        )}
      >
        {EDITABLE_COMPONENTS.map((spec) => {
          const Icon = ICONS[spec.icon] || Sparkles;
          const isExpanded = expanded === spec.id;
          const isActive = activeComponent === spec.id;

          if (compact) {
            return (
              <button
                key={spec.id}
                onClick={() => toggleExpand(spec.id)}
                className={cn(
                  "flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
                  isActive
                    ? "bg-foreground text-background"
                    : "bg-muted text-foreground/70 hover:bg-foreground/10"
                )}
                title={spec.description}
              >
                <Icon className="w-3.5 h-3.5" />
                {spec.label}
              </button>
            );
          }

          return (
            <div
              key={spec.id}
              className={cn(
                "rounded-xl border transition-colors",
                isActive
                  ? "border-champagne/40 bg-champagne/[0.03]"
                  : "border-transparent hover:border-border"
              )}
            >
              <button
                onClick={() => toggleExpand(spec.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
              >
                <span
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                    isActive ? "bg-foreground text-background" : "bg-foreground/5"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium leading-tight">
                    {spec.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {spec.description}
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform",
                    isExpanded && "rotate-180"
                  )}
                />
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <ComponentPresets
                      spec={spec}
                      onApply={(presetPrompt) =>
                        applyEdit({
                          prompt: presetPrompt,
                          component: spec.id,
                          source: "component",
                        })
                      }
                      disabled={isEditing}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ComponentPresets({
  spec,
  onApply,
  disabled,
}: {
  spec: EditableComponentSpec;
  onApply: (prompt: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="px-3 pb-3 space-y-3">
      {/* Preset chips */}
      <div className="flex flex-wrap gap-1.5">
        {spec.presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onApply(preset.prompt)}
            disabled={disabled}
            className="px-2.5 py-1.5 text-[11px] font-medium rounded-full bg-muted hover:bg-foreground/10 text-foreground/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={preset.prompt}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Color palette (if applicable) */}
      {spec.colors && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
            Pick a color
          </div>
          <div className="flex flex-wrap gap-1.5">
            {spec.colors.map((c) => (
              <button
                key={c.label}
                onClick={() =>
                  onApply(`Change the ${spec.label.toLowerCase()} color to ${c.label.toLowerCase()}.`)
                }
                disabled={disabled}
                className="group relative w-7 h-7 rounded-full ring-1 ring-inset ring-black/10 hover:scale-110 transition-transform disabled:opacity-50"
                style={{ backgroundColor: c.hex }}
                title={`${c.label} ${spec.label.toLowerCase()}`}
                aria-label={`${c.label} ${spec.label.toLowerCase()}`}
              >
                <Check className="absolute inset-0 m-auto w-3 h-3 text-white opacity-0 group-hover:opacity-100 drop-shadow" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Option picker (if applicable) */}
      {spec.optionPicker && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
            {spec.optionPicker.label}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {spec.optionPicker.options.map((opt) => (
              <button
                key={opt.label}
                onClick={() => onApply(opt.prompt)}
                disabled={disabled}
                className="px-2.5 py-1.5 text-[11px] font-medium rounded-full bg-muted hover:bg-foreground/10 text-foreground/80 transition-colors disabled:opacity-50"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
