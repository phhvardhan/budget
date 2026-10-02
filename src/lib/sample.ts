import type { Bill, Category, Entry } from "./types";
import { addMonths, daysInMonth, thisMonth } from "./dates";
import { uid } from "./cn";

type Row = [day: number, category: string, description: string, amount: number, method: string, fixed?: boolean, bill?: string];

const MONTH_TEMPLATE: Row[][] = [
  [
    [1, "Housing (Rent/Mortgage)", "Rent", 1500, "Bank transfer", true, "Rent"],
    [2, "Groceries", "Trader Joe's", 118.42, "Debit card"],
    [3, "Emergency Fund", "Transfer to high-yield savings", 400, "Bank transfer", true],
    [5, "Insurance", "Car insurance", 100, "Credit card", true, "Car insurance"],
    [7, "Dining Out & Takeout", "Dinner with friends", 64.8, "Credit card"],
    [9, "Groceries", "Costco run", 96.15, "Debit card"],
    [10, "Entertainment & Subscriptions", "Streaming bundle", 28, "Credit card", true, "Streaming"],
    [12, "Transportation & Fuel", "Fuel", 48.3, "Credit card"],
    [14, "Shopping & Clothing", "Running shoes", 129.99, "Credit card"],
    [15, "Utilities", "Electricity", 92.4, "Autopay", true, "Electricity"],
    [16, "Investments", "Index fund", 300, "Bank transfer", true],
    [18, "Groceries", "H-E-B", 134.6, "Debit card"],
    [20, "Internet & Phone", "Phone", 65, "Autopay", true, "Phone"],
    [22, "Internet & Phone", "Internet", 35, "Autopay", true, "Internet"],
    [23, "Travel & Vacation", "Weekend in Austin", 410, "Credit card"],
    [24, "Dining Out & Takeout", "Takeout", 31.25, "Credit card"],
    [26, "Debt Payments", "Student loan extra payment", 200, "Bank transfer", true],
    [28, "Personal Care & Fitness", "Gym membership", 45, "Credit card", true],
  ],
  [
    [1, "Housing (Rent/Mortgage)", "Rent", 1500, "Bank transfer", true, "Rent"],
    [1, "Emergency Fund", "Transfer to high-yield savings", 400, "Bank transfer", true],
    [3, "Groceries", "Weekly groceries", 142.35, "Debit card"],
    [5, "Insurance", "Car insurance", 100, "Credit card", true, "Car insurance"],
    [6, "Dining Out & Takeout", "Brunch", 38.6, "Credit card"],
    [8, "Family Support", "Sent home", 250, "Bank transfer"],
    [10, "Entertainment & Subscriptions", "Streaming bundle", 28, "Credit card", true, "Streaming"],
    [11, "Groceries", "Groceries", 88.7, "Debit card"],
    [13, "Transportation & Fuel", "Fuel", 51.2, "Credit card"],
    [15, "Utilities", "Electricity", 101.75, "Autopay", true, "Electricity"],
    [16, "Investments", "Index fund", 300, "Bank transfer", true],
    [17, "Healthcare & Medical", "Pharmacy copay", 20, "Debit card"],
    [19, "Shopping & Clothing", "Jacket", 84.5, "Credit card"],
    [20, "Internet & Phone", "Phone", 65, "Autopay", true, "Phone"],
    [21, "Dining Out & Takeout", "Team dinner", 72.4, "Credit card"],
    [22, "Internet & Phone", "Internet", 35, "Autopay", true, "Internet"],
    [24, "Groceries", "Groceries", 121.05, "Debit card"],
    [26, "Debt Payments", "Student loan extra payment", 200, "Bank transfer", true],
    [27, "Gifts & Donations", "Birthday gift", 60, "Credit card"],
    [28, "Personal Care & Fitness", "Gym membership", 45, "Credit card", true],
    [29, "Retirement (extra)", "Roth IRA contribution", 100, "Bank transfer", true],
  ],
  [
    [1, "Housing (Rent/Mortgage)", "Rent", 1500, "Bank transfer", true, "Rent"],
    [1, "Emergency Fund", "Transfer to high-yield savings", 400, "Bank transfer", true],
    [2, "Groceries", "Weekly groceries", 126.8, "Debit card"],
    [2, "Dining Out & Takeout", "Coffee & lunch", 18.45, "Credit card"],
    [4, "Transportation & Fuel", "Uber", 23.1, "Credit card"],
    [5, "Insurance", "Car insurance", 100, "Credit card", true, "Car insurance"],
    [7, "Entertainment & Subscriptions", "Concert tickets", 85, "Credit card"],
    [9, "Groceries", "Groceries", 104.3, "Debit card"],
    [10, "Entertainment & Subscriptions", "Streaming bundle", 28, "Credit card", true, "Streaming"],
    [12, "Dining Out & Takeout", "Sushi night", 56.2, "Credit card"],
    [15, "Utilities", "Electricity", 88.1, "Autopay", true, "Electricity"],
    [16, "Investments", "Index fund", 300, "Bank transfer", true],
  ],
];

const BILLS: [string, string, number | null, number, boolean, string][] = [
  ["Rent", "Housing (Rent/Mortgage)", 1500, 1, false, "Bank transfer"],
  ["Car insurance", "Insurance", 100, 5, true, "Credit card"],
  ["Streaming", "Entertainment & Subscriptions", 28, 10, true, "Credit card"],
  ["Electricity", "Utilities", null, 15, true, "Autopay"],
  ["Phone", "Internet & Phone", 65, 20, true, "Autopay"],
  ["Internet", "Internet & Phone", 35, 22, true, "Autopay"],
];

/** Two full months plus the current month to date, all flagged `isSample` so they can be cleared in one go. */
export function buildSample(categories: Category[], month = thisMonth()) {
  const byName = new Map(categories.map((c) => [c.name, c.id]));
  const bills: Bill[] = BILLS.map(([name, cat, amount, dueDay, autopay, method]) => ({
    id: uid(),
    name,
    categoryId: byName.get(cat) ?? null,
    amount,
    dueDay,
    autopay,
    method,
    isSample: true,
  }));
  const billByName = new Map(bills.map((b) => [b.name, b.id]));
  const today = new Date().getDate();
  const entries: Entry[] = [];
  MONTH_TEMPLATE.forEach((rows, i) => {
    const m = addMonths(month, i - 2);
    const isCurrent = i === 2;
    const max = isCurrent ? today : daysInMonth(m);
    const d = (n: number) => `${m}-${String(Math.min(n, daysInMonth(m))).padStart(2, "0")}`;
    for (const pay of [1, 15]) {
      if (pay > max) continue;
      entries.push({ id: uid(), type: "income", date: d(pay), gross: 3250, deductions: 825, source: "Salary", isSample: true, createdAt: `${d(pay)}T09:00:00Z` });
    }
    rows.forEach(([day, cat, description, amount, method, fixed, bill], j) => {
      if (day > max) return;
      entries.push({
        id: uid(),
        type: "expense",
        date: d(day),
        amount,
        categoryId: byName.get(cat) ?? null,
        description,
        method,
        kind: fixed ? "Fixed" : "Variable",
        billId: bill ? billByName.get(bill === "Streaming" ? "Streaming" : bill) ?? null : null,
        isSample: true,
        createdAt: `${d(day)}T12:${String(j).padStart(2, "0")}:00Z`,
      });
    });
  });
  return { entries, bills };
}
