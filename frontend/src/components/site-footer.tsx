import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="text-lg font-bold tracking-tight text-brand-600">
              VESTI
            </Link>
            <p className="mt-2 text-sm text-neutral-500">
              Fashion, reimagined through AI.
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Explore</h3>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li><Link href="/marketplace" className="hover:text-brand-600">Marketplace</Link></li>
              <li><Link href="/wardrobe" className="hover:text-brand-600">Wardrobe</Link></li>
              <li><Link href="/designers" className="hover:text-brand-600">Designers</Link></li>
              <li><Link href="/playground" className="hover:text-brand-600">AI Playground</Link></li>
              <li><Link href="/studio" className="hover:text-brand-600">Design Studio</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Account</h3>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li><Link href="/sign-in" className="hover:text-brand-600">Sign In</Link></li>
              <li><Link href="/sign-up" className="hover:text-brand-600">Sign Up</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Legal</h3>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li>Privacy</li>
              <li>Terms</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-neutral-100 pt-6 text-center text-xs text-neutral-400">
          &copy; {new Date().getFullYear()} VESTI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
