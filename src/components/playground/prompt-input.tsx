"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Sparkles, Loader2, X } from "lucide-react";
import { useEdit } from "@/hooks/use-edit";
import { SUGGESTED_PROMPTS } from "@/lib/editable-components";
import { useStudioStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function PromptInput() {
  const [value, setValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { applyEdit, isEditing, stage } = useEdit();
  const hasHistory = useStudioStore((s) => s.playgroundHistory.length > 0);

  // Auto-resize the textarea.
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        120,
        textareaRef.current.scrollHeight
      )}px`;
    }
  }, [value]);

  const submit = () => {
    if (!value.trim() || isEditing) return;
    applyEdit({ prompt: value.trim(), source: "user" });
    setValue("");
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-border bg-card">
      {/* Suggestion chips */}
      <AnimatePresence>
        {(showSuggestions || !hasHistory) && !isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pt-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-champagne" />
                Try saying
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setValue(p);
                      textareaRef.current?.focus();
                      setShowSuggestions(false);
                    }}
                    className="px-2.5 py-1.5 text-[11px] font-medium rounded-full bg-muted hover:bg-foreground/10 text-foreground/80 transition-colors text-left"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editing progress strip */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 py-2.5 bg-champagne/[0.04] border-b border-champagne/20 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-champagne" />
              <span className="text-xs font-medium">{stage || "Working…"}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input row */}
      <div className="p-3 flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => !hasHistory && setShowSuggestions(true)}
            placeholder="Describe an edit… (e.g. 'Make the sleeves puffier')"
            rows={1}
            disabled={isEditing}
            className="w-full resize-none px-3 py-2.5 pr-9 text-sm rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground/10 disabled:opacity-50"
          />
          {value && (
            <button
              onClick={() => setValue("")}
              className="absolute top-2 right-2 w-5 h-5 rounded-full hover:bg-foreground/5 flex items-center justify-center text-muted-foreground"
              aria-label="Clear input"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowSuggestions((s) => !s)}
          className="w-9 h-9 rounded-full bg-muted hover:bg-foreground/10 flex items-center justify-center transition-colors flex-shrink-0"
          aria-label="Toggle suggestions"
          title="Show suggested prompts"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        <button
          onClick={submit}
          disabled={!value.trim() || isEditing}
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0",
            value.trim() && !isEditing
              ? "bg-foreground text-background hover:opacity-90 hover:scale-105"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
          aria-label="Submit edit"
        >
          {isEditing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowUp className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="px-3 pb-2 text-[10px] text-muted-foreground">
        Press <kbd className="px-1 py-0.5 rounded bg-muted font-sans">Enter</kbd>{" "}
        to apply · <kbd className="px-1 py-0.5 rounded bg-muted font-sans">Shift+Enter</kbd>{" "}
        for newline
      </div>
    </div>
  );
}
