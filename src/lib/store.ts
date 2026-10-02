"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Bill, Category, Entry, EntryPreset, OutboxOp, Settings, TableName } from "./types";
import { buildDefaultCategories } from "./defaults";
import { thisMonth } from "./dates";
import { uid } from "./cn";
import { buildSample } from "./sample";

/* -------------------------------------------------------------------- ui */

export type SheetState = (
  | { kind: "entry"; type: "expense" | "income"; entry?: Entry; preset?: EntryPreset }
  | { kind: "bill"; bill?: Bill }
) & { nonce: number };

export interface Toast {
  id: number;
  text: string;
  tone?: "default" | "error";
  action?: { label: string; run: () => void };
}

interface UIState {
  hydrated: boolean;
  authReady: boolean;
  session: { userId: string; email: string | null } | null;
  sync: "local" | "idle" | "syncing" | "offline" | "error";
  month: string;
  /** Last opened sheet; kept after closing so the exit animation has content. */
  sheet: SheetState | null;
  sheetOpen: boolean;
  quickAdd: boolean;
  toasts: Toast[];
  set: (p: Partial<UIState>) => void;
  toast: (text: string, opts?: Omit<Toast, "id" | "text">) => void;
  dismiss: (id: number) => void;
}

let tid = 0;
export const useUI = create<UIState>()((set, get) => ({
  hydrated: false,
  authReady: false,
  session: null,
  sync: "local",
  month: thisMonth(),
  sheet: null,
  sheetOpen: false,
  quickAdd: false,
  toasts: [],
  set: (p) => set(p),
  toast: (text, opts) => {
    const id = ++tid;
    set({ toasts: [...get().toasts.slice(-2), { id, text, ...opts }] });
    setTimeout(() => get().dismiss(id), opts?.action ? 5200 : 2800);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));


/* ------------------------------------------------------------------ data */

export interface DataState {
  ownerId: string | null;
  settings: Settings | null;
  categories: Category[];
  entries: Entry[];
  bills: Bill[];
  outbox: OutboxOp[];
  lastSyncedAt: string | null;
}

interface DataActions {
  replaceAll: (d: Partial<DataState>) => void;
  createBudget: (takeHome: number, currency: string) => void;
  saveSettings: (patch: Partial<Settings>) => void;
  upsertCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  upsertEntry: (e: Entry) => void;
  deleteEntry: (id: string) => void;
  upsertBill: (b: Bill) => void;
  deleteBill: (id: string) => void;
  loadSample: () => void;
  clearSample: () => void;
  importBackup: (d: Pick<DataState, "settings" | "categories" | "entries" | "bills">) => void;
  wipeLocal: (ownerId: string | null) => void;
  dequeue: (key: string, at: number) => void;
}

export type DataStore = DataState & DataActions;

const empty: DataState = {
  ownerId: null,
  settings: null,
  categories: [],
  entries: [],
  bills: [],
  outbox: [],
  lastSyncedAt: null,
};

/** Set by the sync layer; called after every local change so it can push to the cloud. */
let onChange: (() => void) | null = null;
let cloudMode = false;
export function bindSync(fn: () => void, cloud: boolean) {
  onChange = fn;
  cloudMode = cloud;
}

function enqueue(outbox: OutboxOp[], ops: { table: TableName; kind: "upsert" | "delete"; rowId: string }[]) {
  if (!cloudMode) return outbox;
  let next = outbox;
  for (const op of ops) {
    const key = `${op.table}:${op.rowId}`;
    next = next.filter((o) => o.key !== key);
    next = [...next, { ...op, key, at: Date.now() + Math.random() }];
  }
  return next;
}

export const useData = create<DataStore>()(
  persist(
    (set, get) => {
      const commit = (patch: Partial<DataState>, ops: Parameters<typeof enqueue>[1]) => {
        set((s) => ({ ...patch, outbox: enqueue(s.outbox, ops) }));
        onChange?.();
      };

      return {
        ...empty,

        replaceAll: (d) => set(d),

        createBudget: (takeHome, currency) => {
          const settings: Settings = {
            takeHome,
            currency,
            targets: { needs: 0.5, wants: 0.3, savings: 0.2 },
            updatedAt: new Date().toISOString(),
          };
          const categories = get().categories.length ? get().categories : buildDefaultCategories(takeHome, uid);
          commit({ settings, categories }, [
            { table: "settings", kind: "upsert", rowId: "settings" },
            ...categories.map((c) => ({ table: "categories" as const, kind: "upsert" as const, rowId: c.id })),
          ]);
        },

        saveSettings: (patch) => {
          const cur = get().settings;
          if (!cur) return;
          commit({ settings: { ...cur, ...patch, updatedAt: new Date().toISOString() } }, [
            { table: "settings", kind: "upsert", rowId: "settings" },
          ]);
        },

        upsertCategory: (c) => {
          const list = get().categories;
          const i = list.findIndex((x) => x.id === c.id);
          const categories = i >= 0 ? list.map((x) => (x.id === c.id ? c : x)) : [...list, c];
          commit({ categories }, [{ table: "categories", kind: "upsert", rowId: c.id }]);
        },

        deleteCategory: (id) => {
          // The database nulls these references itself; mirror it locally so later edits stay valid.
          commit(
            {
              categories: get().categories.filter((c) => c.id !== id),
              entries: get().entries.map((e) => (e.type === "expense" && e.categoryId === id ? { ...e, categoryId: null } : e)),
              bills: get().bills.map((b) => (b.categoryId === id ? { ...b, categoryId: null } : b)),
            },
            [{ table: "categories", kind: "delete", rowId: id }],
          );
        },

        upsertEntry: (e) => {
          const list = get().entries;
          const exists = list.some((x) => x.id === e.id);
          const row = { ...e, createdAt: e.createdAt ?? new Date().toISOString() };
          commit({ entries: exists ? list.map((x) => (x.id === e.id ? row : x)) : [row, ...list] }, [
            { table: "entries", kind: "upsert", rowId: e.id },
          ]);
        },

        deleteEntry: (id) =>
          commit({ entries: get().entries.filter((e) => e.id !== id) }, [{ table: "entries", kind: "delete", rowId: id }]),

        upsertBill: (b) => {
          const list = get().bills;
          const exists = list.some((x) => x.id === b.id);
          commit({ bills: exists ? list.map((x) => (x.id === b.id ? b : x)) : [...list, b] }, [
            { table: "bills", kind: "upsert", rowId: b.id },
          ]);
        },

        deleteBill: (id) =>
          commit(
            {
              bills: get().bills.filter((b) => b.id !== id),
              entries: get().entries.map((e) => (e.type === "expense" && e.billId === id ? { ...e, billId: null } : e)),
            },
            [{ table: "bills", kind: "delete", rowId: id }],
          ),

        loadSample: () => {
          const { categories } = get();
          const { entries, bills } = buildSample(categories, thisMonth());
          commit({ entries: [...entries, ...get().entries], bills: [...get().bills, ...bills] }, [
            ...bills.map((b) => ({ table: "bills" as const, kind: "upsert" as const, rowId: b.id })),
            ...entries.map((e) => ({ table: "entries" as const, kind: "upsert" as const, rowId: e.id })),
          ]);
        },

        clearSample: () => {
          const s = get();
          const gone = s.entries.filter((e) => e.isSample);
          const goneBills = s.bills.filter((b) => b.isSample);
          commit(
            {
              entries: s.entries
                .filter((e) => !e.isSample)
                .map((e) => (e.type === "expense" && goneBills.some((b) => b.id === e.billId) ? { ...e, billId: null } : e)),
              bills: s.bills.filter((b) => !b.isSample),
            },
            [
              ...gone.map((e) => ({ table: "entries" as const, kind: "delete" as const, rowId: e.id })),
              ...goneBills.map((b) => ({ table: "bills" as const, kind: "delete" as const, rowId: b.id })),
            ],
          );
        },

        importBackup: (d) => {
          const s = get();
          commit(
            { settings: d.settings, categories: d.categories, entries: d.entries, bills: d.bills },
            [
              ...s.entries.filter((e) => !d.entries.some((x) => x.id === e.id)).map((e) => ({ table: "entries" as const, kind: "delete" as const, rowId: e.id })),
              ...s.bills.filter((b) => !d.bills.some((x) => x.id === b.id)).map((b) => ({ table: "bills" as const, kind: "delete" as const, rowId: b.id })),
              ...s.categories.filter((c) => !d.categories.some((x) => x.id === c.id)).map((c) => ({ table: "categories" as const, kind: "delete" as const, rowId: c.id })),
              ...(d.settings ? [{ table: "settings" as const, kind: "upsert" as const, rowId: "settings" }] : []),
              ...d.categories.map((c) => ({ table: "categories" as const, kind: "upsert" as const, rowId: c.id })),
              ...d.bills.map((b) => ({ table: "bills" as const, kind: "upsert" as const, rowId: b.id })),
              ...d.entries.map((e) => ({ table: "entries" as const, kind: "upsert" as const, rowId: e.id })),
            ],
          );
        },

        wipeLocal: (ownerId) => set({ ...empty, ownerId }),

        dequeue: (key, at) => set((s) => ({ outbox: s.outbox.filter((o) => !(o.key === key && o.at === at)) })),
      };
    },
    {
      name: "payday-ledger:data",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        ownerId: s.ownerId,
        settings: s.settings,
        categories: s.categories,
        entries: s.entries,
        bills: s.bills,
        outbox: s.outbox,
        lastSyncedAt: s.lastSyncedAt,
      }),
      onRehydrateStorage: () => () => useUI.getState().set({ hydrated: true }),
    },
  ),
);

export const currencyOf = (s: DataState) => s.settings?.currency ?? "USD";
