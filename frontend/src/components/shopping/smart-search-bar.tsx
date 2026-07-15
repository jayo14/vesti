"use client";

import { useState } from "react";

export default function SmartSearchBar() {
  const [query, setQuery] = useState("");

  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products, brands, styles..."
        className="w-full rounded-lg border border-neutral-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
      />
    </div>
  );
}
