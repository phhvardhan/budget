export const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export const dayKey = (d: Date) => `${monthKey(d)}-${String(d.getDate()).padStart(2, "0")}`;

export const todayKey = () => dayKey(new Date());
export const thisMonth = () => monthKey(new Date());

export function addMonths(key: string, n: number) {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y, m - 1 + n, 1));
}

export function daysInMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

export function parseDay(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function monthLabel(key: string, style: "long" | "short" | "full" = "full") {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  if (style === "short") return d.toLocaleDateString("en-US", { month: "short" });
  if (style === "long") return d.toLocaleDateString("en-US", { month: "long" });
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function dayLabel(s: string) {
  const d = parseDay(s);
  const t = new Date();
  const diff = Math.round((new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime() - d.getTime()) / 864e5);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** A date inside `month`: today when it is the current month, else the given day (clamped). */
export function defaultDateIn(month: string, day = 1) {
  if (month === thisMonth()) return todayKey();
  const d = Math.min(Math.max(1, day), daysInMonth(month));
  return `${month}-${String(d).padStart(2, "0")}`;
}
