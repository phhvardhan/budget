import type { Bucket, Category } from "./types";

export const BUCKETS: Record<Bucket, { label: string; short: string; color: string; hint: string }> = {
  needs: { label: "Needs", short: "Needs", color: "#6F86E0", hint: "Rent, groceries, bills — what you can't skip" },
  wants: { label: "Wants", short: "Wants", color: "#C96C97", hint: "Dining, shopping, travel — the fun part" },
  savings: { label: "Savings & Debt", short: "Saved", color: "#B78A34", hint: "Savings, investing, extra debt payments" },
};
export const OTHER_COLOR = "#6B6773";
export const LEFTOVER_COLOR = "#E6D3AE";
export const BUCKET_ORDER: Bucket[] = ["needs", "wants", "savings"];

export const SOURCES = ["Salary", "Bonus", "Side income", "Interest / Dividends", "Tax refund", "Reimbursement", "Other"];
export const METHODS = ["Credit card", "Debit card", "Bank transfer", "Autopay", "Cash", "Zelle / Venmo", "Other"];

export const CURRENCIES: { code: string; label: string; locale: string }[] = [
  { code: "USD", label: "US dollar ($)", locale: "en-US" },
  { code: "INR", label: "Indian rupee (₹)", locale: "en-IN" },
  { code: "EUR", label: "Euro (€)", locale: "de-DE" },
  { code: "GBP", label: "British pound (£)", locale: "en-GB" },
  { code: "CAD", label: "Canadian dollar (C$)", locale: "en-CA" },
  { code: "AUD", label: "Australian dollar (A$)", locale: "en-AU" },
];

/** Budgets are for a $5,000 take-home month and get scaled to the user's pay. */
export const DEFAULT_CATEGORIES: [string, Bucket, number, string[]][] = [
  ["Housing (Rent/Mortgage)", "needs", 1500, ["rent", "mortgage", "lease", "hoa"]],
  ["Utilities", "needs", 150, ["electric", "electricity", "water", "power", "utility", "utilities", "trash"]],
  ["Internet & Phone", "needs", 100, ["internet", "phone", "wifi", "verizon", "att", "tmobile", "xfinity", "spectrum", "mobile"]],
  ["Groceries", "needs", 400, ["grocery", "groceries", "costco", "walmart", "kroger", "heb", "aldi", "trader", "joes", "wholefoods", "safeway", "publix", "indian", "patel"]],
  ["Transportation & Fuel", "needs", 200, ["gas", "fuel", "uber", "lyft", "parking", "toll", "metro", "train", "bus", "car", "shell", "chevron", "exxon"]],
  ["Insurance", "needs", 100, ["insurance", "geico", "progressive", "allstate", "renters"]],
  ["Healthcare & Medical", "needs", 50, ["doctor", "pharmacy", "cvs", "walgreens", "copay", "dentist", "medical", "health"]],
  ["Family Support", "needs", 0, ["family", "parents", "remit", "remittance", "wise", "remitly"]],
  ["Dining Out & Takeout", "wants", 300, ["dinner", "lunch", "breakfast", "brunch", "coffee", "starbucks", "restaurant", "takeout", "doordash", "ubereats", "grubhub", "chipotle", "pizza", "cafe", "bar", "drinks"]],
  ["Shopping & Clothing", "wants", 250, ["amazon", "target", "clothes", "shoes", "shopping", "zara", "nike", "ikea", "bestbuy"]],
  ["Entertainment & Subscriptions", "wants", 150, ["netflix", "spotify", "hulu", "disney", "youtube", "movie", "movies", "concert", "games", "subscription", "prime", "chatgpt", "claude"]],
  ["Travel & Vacation", "wants", 300, ["flight", "hotel", "airbnb", "trip", "vacation", "travel", "airline"]],
  ["Personal Care & Fitness", "wants", 150, ["gym", "haircut", "salon", "spa", "fitness", "yoga"]],
  ["Gifts & Donations", "wants", 100, ["gift", "gifts", "donation", "charity", "temple", "church"]],
  ["Miscellaneous", "wants", 250, ["misc", "other"]],
  ["Emergency Fund", "savings", 400, ["savings", "emergency", "save", "hysa"]],
  ["Investments", "savings", 300, ["invest", "investment", "stocks", "etf", "robinhood", "fidelity", "vanguard", "schwab", "index"]],
  ["Retirement (extra)", "savings", 100, ["ira", "roth", "401k", "retirement"]],
  ["Debt Payments", "savings", 200, ["loan", "debt", "student", "payoff"]],
];

export function buildDefaultCategories(takeHome: number, makeId: () => string): Category[] {
  const f = takeHome > 0 ? takeHome / 5000 : 1;
  const cats = DEFAULT_CATEGORIES.map(([name, bucket, budget], i) => ({
    id: makeId(),
    name,
    bucket,
    budget: Math.round((budget * f) / 10) * 10,
    sort: i,
  }));
  const diff = takeHome - cats.reduce((a, c) => a + c.budget, 0);
  const misc = cats.find((c) => c.name === "Miscellaneous");
  if (misc && takeHome > 0) misc.budget = Math.max(0, Math.round((misc.budget + diff) * 100) / 100);
  return cats;
}

/** Keyword hints for quick-add, matched by category name so renamed defaults still work. */
export function keywordsFor(name: string): string[] {
  const hit = DEFAULT_CATEGORIES.find(([n]) => n === name);
  const own = name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  return [...own, ...(hit ? hit[3] : [])];
}
