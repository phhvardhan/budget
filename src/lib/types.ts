export type Bucket = "needs" | "wants" | "savings";

export interface Settings {
  takeHome: number;
  currency: string;
  targets: Record<Bucket, number>;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  bucket: Bucket;
  budget: number;
  sort: number;
}

interface EntryBase {
  id: string;
  date: string; // YYYY-MM-DD
  note?: string;
  isSample?: boolean;
  createdAt?: string;
}

export interface ExpenseEntry extends EntryBase {
  type: "expense";
  amount: number;
  categoryId: string | null;
  description: string;
  method?: string;
  kind?: "Fixed" | "Variable";
  billId?: string | null;
}

export interface IncomeEntry extends EntryBase {
  type: "income";
  gross: number;
  deductions: number;
  source: string;
}

export type Entry = ExpenseEntry | IncomeEntry;

/** Any subset of entry fields, used to prefill the entry form. */
export type EntryPreset = Partial<Omit<ExpenseEntry, "type"> & Omit<IncomeEntry, "type">>;

export interface Bill {
  id: string;
  name: string;
  categoryId: string | null;
  amount: number | null;
  dueDay: number;
  autopay: boolean;
  method?: string;
  isSample?: boolean;
}

export type TableName = "settings" | "categories" | "entries" | "bills";

export interface OutboxOp {
  key: string; // `${table}:${rowId}`
  table: TableName;
  kind: "upsert" | "delete";
  rowId: string;
  at: number;
}

export interface MonthSummary {
  month: string;
  gross: number;
  deductions: number;
  net: number;
  hasIncome: boolean;
  buckets: Record<Bucket | "other", number>;
  byCategory: Record<string, number>;
  outflow: number;
  spending: number;
  leftover: number;
  totalSaved: number;
  rate: number | null;
  count: number;
}
