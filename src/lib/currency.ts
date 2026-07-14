/**
 * Multi-currency support for the Smart Shopping Marketplace.
 *
 * Prices are stored in USD. We convert to the user's display currency using
 * fixed demo exchange rates (in production these would come from a live FX
 * feed). Currency is detected from query symbols (₦, $, €, £) or explicit
 * currency codes.
 */

export type CurrencyCode = "USD" | "NGN" | "EUR" | "GBP";

export interface CurrencySpec {
  code: CurrencyCode;
  symbol: string;
  /** Display name */
  name: string;
  /** USD → this currency */
  rateFromUSD: number;
  /** Locale for number formatting */
  locale: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencySpec> = {
  USD: { code: "USD", symbol: "$", name: "US Dollar", rateFromUSD: 1, locale: "en-US" },
  NGN: { code: "NGN", symbol: "₦", name: "Nigerian Naira", rateFromUSD: 1480, locale: "en-NG" },
  EUR: { code: "EUR", symbol: "€", name: "Euro", rateFromUSD: 0.92, locale: "en-IE" },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", rateFromUSD: 0.79, locale: "en-GB" },
};

/** Detect currency from a natural-language query. Defaults to USD. */
export function detectCurrency(query: string): CurrencyCode {
  const q = query.toLowerCase();
  if (q.includes("₦") || q.includes("naira") || q.includes(" ngn")) return "NGN";
  if (q.includes("€") || q.includes("euro")) return "EUR";
  if (q.includes("£") || q.includes("pound")) return "GBP";
  return "USD";
}

/**
 * Parse a price mention from a query in the given currency.
 * e.g. "under ₦40,000" → { maxPrice: 40000, currency: 'NGN' }
 */
export function parsePriceMention(
  query: string,
  currency: CurrencyCode
): { maxPrice?: number; minPrice?: number } {
  const cur = CURRENCIES[currency];
  // Escape the symbol for regex
  const sym = cur.symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Match patterns like "under ₦40,000", "₦40,000", "less than 40000 naira"
  const patterns = [
    new RegExp(`${sym}\\s?([\\d,]+)`, "gi"),
    new RegExp(`([\\d,]+)\\s?${sym}`, "gi"),
    new RegExp(`([\\d,]+)\\s?${cur.code}`, "gi"),
  ];
  let maxPrice: number | undefined;
  let minPrice: number | undefined;
  for (const p of patterns) {
    const m = p.exec(query);
    if (m) {
      const n = parseInt(m[1].replace(/,/g, ""), 10);
      if (!isNaN(n)) {
        // Heuristic: "under" / "less than" / "below" → max; "over" / "more than" → min
        const lower = query.toLowerCase();
        if (/under|less than|below|cheaper than|max/.test(lower)) maxPrice = n;
        else if (/over|more than|above|min|at least/.test(lower)) minPrice = n;
        else maxPrice = n; // default to ceiling
        break;
      }
    }
  }
  return { maxPrice, minPrice };
}

/** Convert a USD price to a target currency. */
export function convertFromUSD(usd: number, to: CurrencyCode): number {
  return Math.round(usd * CURRENCIES[to].rateFromUSD);
}

/** Format a USD price in the target currency. */
export function formatPrice(usd: number, currency: CurrencyCode = "USD"): string {
  const converted = convertFromUSD(usd, currency);
  const cur = CURRENCIES[currency];
  // For NGN we don't use decimals; for USD/EUR/GBP we show no decimals either
  // since the source prices are whole dollars.
  return `${cur.symbol}${converted.toLocaleString(cur.locale)}`;
}

/** Convert a price in a target currency back to USD (for budget filtering). */
export function convertToUSD(amount: number, from: CurrencyCode): number {
  return amount / CURRENCIES[from].rateFromUSD;
}
