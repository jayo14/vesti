"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchProfile, isAuthenticated, logout, type User } from "@/lib/auth";

export default function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      setChecked(true);
      return;
    }
    fetchProfile()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecked(true));
  }, []);

  function onLogout() {
    logout();
    setUser(null);
    window.location.href = "/sign-in";
  }

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          VESTI
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/marketplace" className="text-neutral-600 hover:text-brand-600">
            Marketplace
          </Link>
          <Link href="/wardrobe" className="text-neutral-600 hover:text-brand-600">
            Wardrobe
          </Link>
          <Link href="/playground" className="text-neutral-600 hover:text-brand-600">
            Playground
          </Link>
          <Link href="/designers" className="text-neutral-600 hover:text-brand-600">
            Designers
          </Link>
          <Link href="/studio" className="text-neutral-600 hover:text-brand-600">
            Studio
          </Link>
          {checked && user ? (
            <>
              <span className="text-neutral-600">Hi, {user.username}</span>
              <button
                onClick={onLogout}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 font-medium text-neutral-700 transition hover:bg-neutral-100"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="rounded-lg border border-neutral-300 px-3 py-1.5 font-medium text-neutral-700 transition hover:bg-neutral-100"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-lg bg-brand-600 px-3 py-1.5 font-semibold text-white transition hover:bg-brand-700"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
