"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchProfile, isAuthenticated, logout, type User } from "@/lib/auth";

const navLinks = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/wardrobe", label: "Wardrobe" },
  { href: "/playground", label: "Playground" },
  { href: "/designers", label: "Designers" },
  { href: "/studio", label: "Studio" },
];

export default function SiteHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 sm:hidden"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
        <nav className="hidden items-center gap-4 text-sm sm:flex">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="text-neutral-600 hover:text-brand-600">
              {l.label}
            </Link>
          ))}
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
      {menuOpen && (
        <div className="border-t border-neutral-200 bg-white px-4 py-3 sm:hidden">
          <nav className="flex flex-col gap-3 text-sm">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-neutral-600 hover:text-brand-600"
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <hr className="border-neutral-200" />
            {checked && user ? (
              <>
                <span className="text-neutral-600">Hi, {user.username}</span>
                <button
                  onClick={onLogout}
                  className="rounded-lg border border-neutral-300 px-3 py-1.5 text-left font-medium text-neutral-700 transition hover:bg-neutral-100"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="rounded-lg border border-neutral-300 px-3 py-1.5 font-medium text-neutral-700 transition hover:bg-neutral-100"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-center font-semibold text-white transition hover:bg-brand-700"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
