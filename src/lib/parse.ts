import type { Category } from "./types";
import { keywordsFor, SOURCES } from "./defaults";
import { dayKey, todayKey } from "./dates";

export interface QuickParse {
  type: "expense" | "income";
  amount: number | null;
  categoryId: string | null;
  description: string;
  date: string;
  source: string;
}

const INCOME_WORDS: Record<string, string> = {
  salary: "Salary",
  paycheck: "Salary",
  payroll: "Salary",
  pay: "Salary",
  bonus: "Bonus",
  freelance: "Side income",
  side: "Side income",
  interest: "Interest / Dividends",
  dividend: "Interest / Dividends",
  dividends: "Interest / Dividends",
  refund: "Tax refund",
  reimbursement: "Reimbursement",
};

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/**
 * Turns "54.20 groceries trader joes", "uber 18 yesterday" or "+3250 salary" into an entry draft.
 * Matching is forgiving: the first number is the amount, keywords pick the category,
 * whatever is left becomes the description.
 */
export function parseQuick(input: string, categories: Category[]): QuickParse {
  const raw = input.trim();
  let tokens = raw.split(/\s+/).filter(Boolean);
  let type: "expense" | "income" = raw.startsWith("+") ? "income" : "expense";
  let amount: number | null = null;
  let date = todayKey();
  let source = "Salary";

  const rest: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const lower = t.toLowerCase();
    const num = t.replace(/^[+]/, "").replace(/[$₹€£,]/g, "");
    if (amount == null && /^-?\d+(\.\d{1,2})?k?$/i.test(num)) {
      amount = num.toLowerCase().endsWith("k") ? parseFloat(num) * 1000 : parseFloat(num);
      continue;
    }
    if (lower === "today") continue;
    if (lower === "yesterday") {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      date = dayKey(d);
      continue;
    }
    const md = lower.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (md) {
      const d = new Date(new Date().getFullYear(), Number(md[1]) - 1, Number(md[2]));
      if (!isNaN(d.getTime())) date = dayKey(d);
      continue;
    }
    const mi = MONTHS.indexOf(lower.slice(0, 3));
    if (mi >= 0 && tokens[i + 1] && /^\d{1,2}$/.test(tokens[i + 1])) {
      date = dayKey(new Date(new Date().getFullYear(), mi, Number(tokens[i + 1])));
      i++;
      continue;
    }
    if (INCOME_WORDS[lower] && (type === "income" || rest.length === 0)) {
      type = "income";
      source = INCOME_WORDS[lower];
      continue;
    }
    rest.push(t);
  }
  tokens = rest;

  let categoryId: string | null = null;
  let matched: string[] = [];
  if (type === "expense") {
    let best = 0;
    for (const c of categories) {
      const hits: string[] = [];
      const kws = keywordsFor(c.name);
      let score = 0;
      for (const t of tokens) {
        const w = t.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!w) continue;
        if (kws.includes(w)) {
          score += 3;
          hits.push(t);
        }
        else if (w.length > 3 && kws.some((k) => k.startsWith(w) || w.startsWith(k))) score += 1;
      }
      if (score > best) {
        best = score;
        categoryId = c.id;
        matched = hits;
      }
    }
  }

  // Drop generic category words ("groceries", "lunch") but keep names like "Trader Joes" or "Uber".
  const generic = new Set(categories.flatMap((c) => c.name.toLowerCase().split(/[^a-z0-9]+/)).concat(["groceries", "grocery", "food", "bill", "payment"]));
  const kept = tokens.filter((t) => !(matched.includes(t) && generic.has(t.toLowerCase()) && tokens.length > 1));
  const description = kept
    .join(" ")
    .replace(/^\+/, "")
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .trim();

  if (!SOURCES.includes(source)) source = "Other";
  return { type, amount, categoryId, description, date, source };
}
