"use client";

import { useCallback, useRef, useState } from "react";
import type { EditAction, EditRequest, EditResponse, EditableComponent } from "@/lib/types";
import { useStudioStore } from "@/lib/store";
import { toast } from "sonner";

const STAGES = [
  { at: 0, label: "Analyzing current design…" },
  { at: 25, label: "Applying your edit…" },
  { at: 60, label: "Rendering updated garment…" },
  { at: 85, label: "Finalizing the new look…" },
];

interface UseEditResult {
  isEditing: boolean;
  stage: string;
  progress: number;
  error: string | null;
  applyEdit: (params: {
    prompt: string;
    component?: EditableComponent;
    source?: EditAction["source"];
    onSuccess?: () => void;
  }) => Promise<void>;
  reset: () => void;
}

/**
 * Hook that wraps the /api/edit endpoint with progress ticker + history push.
 * Reads current playground image from the store and pushes the resulting
 * EditAction onto the playground history.
 */
export function useEdit(): UseEditResult {
  const {
    playgroundImage,
    isEditing,
    setIsEditing,
    pushEdit,
  } = useStudioStore();

  const [stage, setStage] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTicker = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTicker = useCallback(() => {
    let p = 0;
    stopTicker();
    timerRef.current = setInterval(() => {
      p += (90 - p) * 0.04 + 0.5;
      if (p >= 90) p = 90;
      setProgress(Math.min(90, p));
      const found = [...STAGES].reverse().find((s) => p >= s.at);
      if (found) setStage(found.label);
    }, 250);
  }, [stopTicker]);

  const applyEdit = useCallback(
    async ({
      prompt,
      component,
      source = "user",
      onSuccess,
    }: {
      prompt: string;
      component?: EditableComponent;
      source?: EditAction["source"];
      onSuccess?: () => void;
    }) => {
      if (!playgroundImage) {
        toast.error("Load an image into the playground first.");
        return;
      }
      if (!prompt.trim()) {
        toast.error("Please describe the edit you want.");
        return;
      }

      setError(null);
      setIsEditing(true);
      setProgress(0);
      setStage(STAGES[0].label);
      startTicker();

      const beforeImage = playgroundImage;

      try {
        const body: EditRequest = {
          image: beforeImage,
          prompt,
          component,
          preservePerson: true,
        };
        const res = await fetch("/api/edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data: EditResponse = await res.json();

        if (!data.success || !data.resultImage) {
          throw new Error(data.error || "Edit failed. Please try again.");
        }

        stopTicker();
        setProgress(100);
        setStage("Done");
        await new Promise((r) => setTimeout(r, 250));

        const edit: EditAction = {
          id: `edit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: Date.now(),
          prompt,
          component,
          beforeImage,
          afterImage: data.resultImage,
          source,
        };
        pushEdit(edit);
        setIsEditing(false);
        onSuccess?.();
        toast.success("Edit applied.");
      } catch (err) {
        stopTicker();
        setIsEditing(false);
        const msg = err instanceof Error ? err.message : "Edit failed.";
        setError(msg);
        toast.error(msg);
      }
    },
    [playgroundImage, setIsEditing, pushEdit, startTicker, stopTicker]
  );

  const reset = useCallback(() => {
    stopTicker();
    setIsEditing(false);
    setProgress(0);
    setStage("");
    setError(null);
  }, [setIsEditing, stopTicker]);

  return {
    isEditing,
    stage,
    progress,
    error,
    applyEdit,
    reset,
  };
}
