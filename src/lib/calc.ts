import type { Bill, Bucket, Category, Entry, ExpenseEntry, MonthSummary, Settings } from "./types";
import { daysInMonth, thisMonth } from "./dates";

export function entriesIn(entries: Entry[], month: string) {
  return entries.filter((e) => e.date.startsWith(month));
}

export function netOf(e: Entry) {
  return e.type === "income" ? (e.gross || 0) - (e.deductions || 0) : -(e.amount || 0);
}

export function summarize(month: string, entries: Entry[], categories: Category[]): MonthSummary {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const list = entriesIn(entries, month);
  let gross = 0,
    deductions = 0,
    hasIncome = false;
  const buckets: Record<Bucket | "other", number> = { needs: 0, wants: 0, savings: 0, other: 0 };
  const byCategory: Record<string, number> = {};
  for (const e of list) {
    if (e.type === "income") {
      hasIncome = true;
      gross += e.gross || 0;
      deductions += e.deductions || 0;
    } else {
      const amt = e.amount || 0;
      const cat = e.categoryId ? byId.get(e.categoryId) : undefined;
      buckets[cat ? cat.bucket : "other"] += amt;
      const k = cat ? cat.id : "__other";
      byCategory[k] = (byCategory[k] || 0) + amt;
    }
  }
  const net = gross - deductions;
  const outflow = buckets.needs + buckets.wants + buckets.savings + buckets.other;
  const spending = buckets.needs + buckets.wants + buckets.other;
  const leftover = net - outflow;
  const totalSaved = buckets.savings + leftover;
  return {
    month,
    gross,
    deductions,
    net,
    hasIncome,
    buckets,
    byCategory,
    outflow,
    spending,
    leftover,
    totalSaved,
    rate: net > 0 ? totalSaved / net : null,
    count: list.length,
  };
}

export function bucketBudgets(categories: Category[]) {
  const r: Record<Bucket, number> = { needs: 0, wants: 0, savings: 0 };
  for (const c of categories) r[c.bucket] += c.budget || 0;
  return r;
}

export function targetsOf(settings: Settings | null): Record<Bucket, number> {
  return { needs: 0.5, wants: 0.3, savings: 0.2, ...(settings?.targets ?? {}) };
}

export type BudgetState = "ok" | "near" | "full" | "over" | "unbudgeted" | "idle";
export function budgetState(spent: number, budget: number): BudgetState {
  if (budget <= 0) return spent > 0 ? "unbudgeted" : "idle";
  const u = spent / budget;
  if (u > 1.0001) return "over";
  if (u >= 0.9999) return "full";
  if (u >= 0.85) return "near";
  return "ok";
}

export type BillState =
  | { kind: "paid"; entry: ExpenseEntry }
  | { kind: "overdue"; days: number }
  | { kind: "due"; days: number }
  | { kind: "upcoming" }
  | { kind: "missed" };

export function billStates(month: string, bills: Bill[], entries: Entry[]) {
  const list = entriesIn(entries, month).filter((e): e is ExpenseEntry => e.type === "expense");
  const cur = thisMonth();
  const today = new Date().getDate();
  return [...bills]
    .sort((a, b) => a.dueDay - b.dueDay)
    .map((bill) => {
      const day = Math.min(bill.dueDay || 1, daysInMonth(month));
      const paid = list.find((e) => e.billId === bill.id);
      let state: BillState;
      if (paid) state = { kind: "paid", entry: paid };
      else if (month < cur) state = { kind: "missed" };
      else if (month > cur) state = { kind: "upcoming" };
      else state = day < today ? { kind: "overdue", days: today - day } : { kind: "due", days: day - today };
      return { bill, day, state };
    });
}

export function dailySpending(month: string, entries: Entry[]) {
  const n = daysInMonth(month);
  const days = Array.from({ length: n }, () => 0);
  for (const e of entriesIn(entries, month)) {
    if (e.type !== "expense") continue;
    const d = Number(e.date.slice(8, 10));
    if (d >= 1 && d <= n) days[d - 1] += e.amount || 0;
  }
  return days;
}

export function sortEntries(list: Entry[]) {
  return [...list].sort(
    (a, b) => b.date.localeCompare(a.date) || (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
  );
}
