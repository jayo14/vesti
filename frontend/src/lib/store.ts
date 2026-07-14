"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ViewMode,
  ComparisonMode,
  Garment,
  SavedLook,
  EditAction,
  EditableComponent,
} from "@/lib/types";
import type { MaterialId } from "@/lib/materials";

interface StudioState {
  // Navigation
  view: ViewMode;
  setView: (view: ViewMode) => void;

  // Person photo
  personImage: string | null;
  setPersonImage: (img: string | null) => void;

  // Selected garment
  selectedGarment: Garment | null;
  setSelectedGarment: (g: Garment | null) => void;

  // Custom uploaded garment (when user uploads clothing image directly)
  customGarmentImage: string | null;
  setCustomGarmentImage: (img: string | null) => void;

  // Garment selection source
  garmentSource: "marketplace" | "upload" | "designer" | null;
  setGarmentSource: (s: StudioState["garmentSource"]) => void;

  // Material selection — drives AI material-aware generation.
  // When a marketplace garment has its own material, that becomes the default.
  selectedMaterial: MaterialId | null;
  setSelectedMaterial: (m: MaterialId | null) => void;

  // Generation
  isGenerating: boolean;
  generationProgress: number;
  generationStage: string;
  resultImage: string | null;
  setIsGenerating: (v: boolean) => void;
  setGenerationProgress: (n: number) => void;
  setGenerationStage: (s: string) => void;
  setResultImage: (img: string | null) => void;
  resetGeneration: () => void;

  // Comparison
  comparisonMode: ComparisonMode;
  setComparisonMode: (m: ComparisonMode) => void;

  // Saved looks (persisted to localStorage)
  savedLooks: SavedLook[];
  saveLook: (look: SavedLook) => void;
  deleteLook: (id: string) => void;

  // Theme
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (t: "light" | "dark") => void;

  // Marketplace filters
  categoryFilter: string;
  setCategoryFilter: (c: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // === AI Fashion Playground ===
  /** The image currently being edited (origin image or latest edit result). */
  playgroundImage: string | null;
  setPlaygroundImage: (img: string | null) => void;
  /** The original image the user started from (for "reset to original"). */
  playgroundOriginImage: string | null;
  setPlaygroundOriginImage: (img: string | null) => void;
  /** Ordered list of edits applied (newest at end). */
  playgroundHistory: EditAction[];
  /** Index of the currently-shown version in playgroundHistory (-1 = origin). */
  playgroundVersion: number;
  /** True while an edit is being generated. */
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  /** Initialize a playground session with a starting image. */
  startPlayground: (image: string) => void;
  /** Append a new edit and advance the version pointer. */
  pushEdit: (edit: EditAction) => void;
  /** Jump to a specific version (by index, or -1 for origin). */
  setPlaygroundVersion: (v: number) => void;
  /** Undo the latest edit (decrement version, change shown image). */
  undoEdit: () => void;
  /** Redo a previously-undone edit (increment version). */
  redoEdit: () => void;
  /** Reset to the origin image and clear history. */
  resetPlayground: () => void;
  /** Active component being edited in the control panel (for highlight state). */
  activeComponent: EditableComponent | null;
  setActiveComponent: (c: EditableComponent | null) => void;
}

export const useStudioStore = create<StudioState>()(
  persist(
    (set) => ({
      view: "hero",
      setView: (view) => set({ view }),

      personImage: null,
      setPersonImage: (personImage) => set({ personImage }),

      selectedGarment: null,
      setSelectedGarment: (selectedGarment) => set({ selectedGarment }),

      customGarmentImage: null,
      setCustomGarmentImage: (customGarmentImage) => set({ customGarmentImage }),

      garmentSource: null,
      setGarmentSource: (garmentSource) => set({ garmentSource }),

      selectedMaterial: null,
      setSelectedMaterial: (selectedMaterial) => set({ selectedMaterial }),

      isGenerating: false,
      generationProgress: 0,
      generationStage: "",
      resultImage: null,
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      setGenerationProgress: (generationProgress) => set({ generationProgress }),
      setGenerationStage: (generationStage) => set({ generationStage }),
      setResultImage: (resultImage) => set({ resultImage }),
      resetGeneration: () =>
        set({
          isGenerating: false,
          generationProgress: 0,
          generationStage: "",
          resultImage: null,
        }),

      comparisonMode: "slider",
      setComparisonMode: (comparisonMode) => set({ comparisonMode }),

      savedLooks: [],
      saveLook: (look) =>
        set((state) => ({ savedLooks: [look, ...state.savedLooks].slice(0, 50) })),
      deleteLook: (id) =>
        set((state) => ({ savedLooks: state.savedLooks.filter((l) => l.id !== id) })),

      theme: "light",
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
      setTheme: (theme) => set({ theme }),

      categoryFilter: "all",
      setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
      searchQuery: "",
      setSearchQuery: (searchQuery) => set({ searchQuery }),

      // === AI Fashion Playground ===
      playgroundImage: null,
      setPlaygroundImage: (playgroundImage) => set({ playgroundImage }),
      playgroundOriginImage: null,
      setPlaygroundOriginImage: (playgroundOriginImage) =>
        set({ playgroundOriginImage }),
      playgroundHistory: [],
      playgroundVersion: -1,
      isEditing: false,
      setIsEditing: (isEditing) => set({ isEditing }),
      startPlayground: (image) =>
        set({
          playgroundImage: image,
          playgroundOriginImage: image,
          playgroundHistory: [],
          playgroundVersion: -1,
          isEditing: false,
          activeComponent: null,
        }),
      pushEdit: (edit) =>
        set((state) => {
          // If we're not at the tip of history (user did some undos), truncate
          // the future and append the new edit as the new tip.
          const tipIndex = state.playgroundVersion;
          const truncated =
            tipIndex === -1
              ? state.playgroundHistory
              : state.playgroundHistory.slice(0, tipIndex + 1);
          const nextHistory = [...truncated, edit];
          return {
            playgroundHistory: nextHistory,
            playgroundVersion: nextHistory.length - 1,
            playgroundImage: edit.afterImage,
          };
        }),
      setPlaygroundVersion: (v) =>
        set((state) => {
          const image =
            v === -1
              ? state.playgroundOriginImage
              : state.playgroundHistory[v]?.afterImage || state.playgroundOriginImage;
          return { playgroundVersion: v, playgroundImage: image };
        }),
      undoEdit: () =>
        set((state) => {
          if (state.playgroundVersion < 0) return state;
          const next = state.playgroundVersion - 1;
          const image =
            next === -1
              ? state.playgroundOriginImage
              : state.playgroundHistory[next]?.afterImage ||
                state.playgroundOriginImage;
          return { playgroundVersion: next, playgroundImage: image };
        }),
      redoEdit: () =>
        set((state) => {
          const max = state.playgroundHistory.length - 1;
          if (state.playgroundVersion >= max) return state;
          const next = state.playgroundVersion + 1;
          return {
            playgroundVersion: next,
            playgroundImage: state.playgroundHistory[next].afterImage,
          };
        }),
      resetPlayground: () =>
        set((state) => ({
          playgroundImage: state.playgroundOriginImage,
          playgroundHistory: [],
          playgroundVersion: -1,
          isEditing: false,
          activeComponent: null,
        })),
      activeComponent: null,
      setActiveComponent: (activeComponent) => set({ activeComponent }),
    }),
    {
      name: "ai-fashion-studio",
      partialize: (state) => ({
        savedLooks: state.savedLooks,
        theme: state.theme,
        comparisonMode: state.comparisonMode,
      }),
    }
  )
);
