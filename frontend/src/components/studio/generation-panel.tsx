"use client";

import { useState } from "react";

export default function GenerationPanel() {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-neutral-700">Generate</h3>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your design..."
        rows={2}
        className="w-full resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
      />
      <button
        disabled={!prompt.trim()}
        className="w-full rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        Generate
      </button>
    </div>
  );
}
