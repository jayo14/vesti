"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Layers, X, Check, Info } from "lucide-react";
import { useState } from "react";
import {
  MATERIALS,
  getMaterial,
  type MaterialId,
  type MaterialSpec,
} from "@/lib/materials";
import { cn } from "@/lib/utils";

interface MaterialPickerProps {
  value: MaterialId | null;
  onChange: (m: MaterialId | null) => void;
  /** If true, render as a compact inline strip (no heading). */
  compact?: boolean;
}

export function MaterialPicker({
  value,
  onChange,
  compact = false,
}: MaterialPickerProps) {
  const [detailFor, setDetailFor] = useState<MaterialId | null>(null);
  const selected = value ? getMaterial(value) : undefined;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 py-1">
        {value && (
          <button
            onClick={() => onChange(null)}
            className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-full bg-muted text-muted-foreground hover:bg-foreground/10 transition-colors"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
        {MATERIALS.map((m) => {
          const active = value === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onChange(m.id)}
              className={cn(
                "flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-full transition-all",
                active
                  ? "bg-foreground text-background"
                  : "bg-muted text-foreground/70 hover:bg-foreground/10"
              )}
            >
              <span
                className="w-3 h-3 rounded-full ring-1 ring-inset ring-black/10"
                style={{
                  background: m.swatchPattern || m.swatch,
                }}
              />
              {m.name}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-champagne" />
          <h3 className="font-serif text-base font-medium">Fabric Material</h3>
          {selected && (
            <span className="text-[11px] text-muted-foreground">
              · {selected.origin}
            </span>
          )}
        </div>
        {value && (
          <button
            onClick={() => onChange(null)}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {MATERIALS.map((m) => {
          const active = value === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onChange(active ? null : m.id)}
              onMouseEnter={() => setDetailFor(m.id)}
              onMouseLeave={() => setDetailFor(null)}
              className={cn(
                "group relative p-3 rounded-2xl border-2 text-left transition-all",
                active
                  ? "border-champagne bg-champagne/5"
                  : "border-border bg-card hover:border-foreground/20"
              )}
            >
              {/* Swatch */}
              <div
                className="w-full h-12 rounded-lg mb-2 ring-1 ring-inset ring-black/10"
                style={{
                  background: m.swatchPattern || m.swatch,
                }}
              />
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-medium leading-tight">{m.name}</span>
                {active && (
                  <Check
                    className="w-3.5 h-3.5 text-champagne flex-shrink-0"
                    strokeWidth={3}
                  />
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="capitalize">{m.drape}</span>
                <span>·</span>
                <span className="capitalize">{m.weight}</span>
                <span>·</span>
                <span className="capitalize">{m.sheen}</span>
              </div>

              {/* Info button */}
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailFor((cur) => (cur === m.id ? null : m.id));
                }}
                className="absolute top-2 right-2 w-5 h-5 rounded-full bg-background/70 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`More info about ${m.name}`}
              >
                <Info className="w-3 h-3" />
              </span>
            </button>
          );
        })}
      </div>

      {/* Inline material detail popover */}
      <AnimatePresence>
        {detailFor && (
          <MaterialDetail
            material={getMaterial(detailFor)!}
            onClose={() => setDetailFor(null)}
          />
        )}
      </AnimatePresence>

      {/* Selected material context */}
      <AnimatePresence>
        {selected && !detailFor && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-3 overflow-hidden"
          >
            <div className="p-3 rounded-2xl bg-muted/40 border border-border">
              <p className="text-xs leading-relaxed text-foreground/80">
                <span className="font-medium">{selected.name}:</span>{" "}
                {selected.summary}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selected.suitableFor.slice(0, 3).map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-background"
                  >
                    <Check className="w-2.5 h-2.5 text-champagne" />
                    {s}
                  </span>
                ))}
                {selected.avoid.slice(0, 1).map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-destructive/10 text-destructive"
                  >
                    <X className="w-2.5 h-2.5" />
                    Avoid: {s}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MaterialDetail({
  material,
  onClose,
}: {
  material: MaterialSpec;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2 }}
      className="mt-3 p-4 rounded-2xl bg-card border-2 border-champagne/40 shadow-premium relative"
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 w-6 h-6 rounded-full hover:bg-foreground/5 flex items-center justify-center"
        aria-label="Close"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-xl flex-shrink-0 ring-1 ring-inset ring-black/10"
          style={{ background: material.swatchPattern || material.swatch }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h4 className="font-serif text-lg">{material.name}</h4>
            <span className="text-[11px] text-muted-foreground">
              {material.origin}
            </span>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed mt-1">
            {material.summary}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2 text-[11px]">
        <Prop label="Drape" value={material.drape} />
        <Prop label="Weight" value={material.weight} />
        <Prop label="Sheen" value={material.sheen} />
        <Prop label="Structure" value={material.structure} />
      </div>

      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
            Suitable for
          </div>
          <ul className="space-y-0.5">
            {material.suitableFor.map((s) => (
              <li
                key={s}
                className="text-[11px] text-foreground/80 flex items-start gap-1.5"
              >
                <Check className="w-3 h-3 mt-0.5 text-champagne flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
            Avoid — impossible with this fabric
          </div>
          <ul className="space-y-0.5">
            {material.avoid.map((s) => (
              <li
                key={s}
                className="text-[11px] text-foreground/70 flex items-start gap-1.5"
              >
                <X className="w-3 h-3 mt-0.5 text-destructive flex-shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

function Prop({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-1.5 rounded-lg bg-muted/50">
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-[11px] font-medium capitalize mt-0.5">{value}</div>
    </div>
  );
}
