"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, User, RotateCcw, Wand2, Check } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { EDITABLE_COMPONENT_MAP } from "@/lib/editable-components";
import { cn } from "@/lib/utils";
import { useRef, useEffect } from "react";

export function PromptHistory() {
  const {
    playgroundHistory,
    playgroundVersion,
    playgroundOriginImage,
    setPlaygroundVersion,
  } = useStudioStore();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new edits arrive.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [playgroundHistory.length]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 border-b border-border">
        <h3 className="font-serif text-base font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-champagne" />
          Edit History
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Click any step to jump back to that version.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Origin row */}
        <HistoryRow
          active={playgroundVersion === -1}
          onClick={() => setPlaygroundVersion(-1)}
          icon={<RotateCcw className="w-3 h-3" />}
          label="Original image"
          sub="Starting point"
          accent={false}
        />

        {playgroundHistory.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Wand2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Your edits will appear here.</p>
            <p className="text-[11px] mt-1 opacity-80">
              Use the prompt box below or click a component preset.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {playgroundHistory.map((edit, i) => {
            const isActive = playgroundVersion === i;
            const isPast = playgroundVersion < i; // undone
            const comp = edit.component
              ? EDITABLE_COMPONENT_MAP[edit.component]
              : null;
            return (
              <motion.div
                key={edit.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: isPast ? 0.45 : 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <HistoryRow
                  active={isActive}
                  onClick={() => setPlaygroundVersion(i)}
                  icon={
                    edit.source === "user" ? (
                      <User className="w-3 h-3" />
                    ) : (
                      <Wand2 className="w-3 h-3" />
                    )
                  }
                  label={edit.prompt}
                  sub={
                    comp
                      ? `${comp.label} · ${formatTime(edit.createdAt)}`
                      : formatTime(edit.createdAt)
                  }
                  accent={isActive}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer summary */}
      <div className="px-4 py-2 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
        <span>
          {playgroundHistory.length === 0
            ? "No edits yet"
            : `${playgroundHistory.length} edit${
                playgroundHistory.length !== 1 ? "s" : ""
              }`}
        </span>
        <span>
          {playgroundVersion === -1
            ? "Viewing original"
            : `Viewing edit ${playgroundVersion + 1}`}
        </span>
      </div>
    </div>
  );
}

function HistoryRow({
  active,
  onClick,
  icon,
  label,
  sub,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-2.5 rounded-xl border transition-all",
        active
          ? "border-champagne/50 bg-champagne/[0.06] shadow-premium"
          : "border-border bg-card hover:bg-foreground/[0.02]"
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
            accent
              ? "bg-foreground text-background"
              : "bg-muted text-foreground/70"
          )}
        >
          {active ? <Check className="w-3 h-3" /> : icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium leading-snug line-clamp-2">
            {label}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>
        </div>
      </div>
    </button>
  );
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleDateString();
}
