import { CURRENCIES } from "./defaults";

const cache = new Map<string, Intl.NumberFormat>();

function fmt(currency: string, decimals: boolean, compact = false) {
  const key = `${currency}|${decimals}|${compact}`;
  let f = cache.get(key);
  if (!f) {
    const locale = CURRENCIES.find((c) => c.code === currency)?.locale ?? "en-US";
    f = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: compact ? 0 : decimals ? 2 : 0,
      maximumFractionDigits: compact ? 1 : decimals ? 2 : 0,
      notation: compact ? "compact" : "standard",
    });
    cache.set(key, f);
  }
  return f;
}

export const formatMoney = (n: number, currency = "USD", decimals = false) =>
  fmt(currency, decimals).format(Number.isFinite(n) ? n : 0);

export const formatCompact = (n: number, currency = "USD") =>
  Math.abs(n) >= 10000 ? fmt(currency, false, true).format(n) : fmt(currency, false).format(n);

export const currencySymbol = (currency = "USD") =>
  fmt(currency, false)
    .formatToParts(0)
    .find((p) => p.type === "currency")?.value ?? "$";

export function formatPct(n: number | null | undefined, digits?: number) {
  if (n == null || !Number.isFinite(n)) return "—";
  const v = n * 100;
  const d = digits ?? (Math.abs(v) < 10 && v !== 0 ? 1 : 0);
  return `${v.toFixed(d)}%`;
}
