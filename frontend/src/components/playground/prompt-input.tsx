"use client";

import { useState } from "react";

export default function PromptInput() {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-neutral-700">
        Describe your garment
      </label>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. A flowing silk dress with floral embroidery..."
        rows={3}
        className="w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
      />
      <button
        disabled={!prompt.trim()}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Generate
      </button>
    </div>
  );
}
