"use client";

import { useMemo } from "react";
import { useData, useUI } from "./store";
import { summarize } from "./calc";
import { addMonths } from "./dates";
import type { Bill, Entry, EntryPreset } from "./types";

export const useMonth = () => useUI((s) => s.month);
export const setMonth = (m: string) => useUI.getState().set({ month: m });

export function useSummary(month: string) {
  const entries = useData((s) => s.entries);
  const categories = useData((s) => s.categories);
  return useMemo(() => summarize(month, entries, categories), [month, entries, categories]);
}

export function useTrailing(month: string, count = 12) {
  const entries = useData((s) => s.entries);
  const categories = useData((s) => s.categories);
  return useMemo(
    () => Array.from({ length: count }, (_, i) => summarize(addMonths(month, i - count + 1), entries, categories)),
    [month, count, entries, categories],
  );
}

export function openEntry(type: "expense" | "income", entry?: Entry, preset?: EntryPreset) {
  useUI.getState().set({ sheet: { kind: "entry", type, entry, preset, nonce: Date.now() }, sheetOpen: true, quickAdd: false });
}
export function openBill(bill?: Bill) {
  useUI.getState().set({ sheet: { kind: "bill", bill, nonce: Date.now() }, sheetOpen: true });
}
export function closeSheet() {
  useUI.getState().set({ sheetOpen: false });
}

export function deleteEntryWithUndo(entry: Entry) {
  useData.getState().deleteEntry(entry.id);
  useUI.getState().toast(entry.type === "income" ? "Income deleted" : "Expense deleted", {
    action: { label: "Undo", run: () => useData.getState().upsertEntry(entry) },
  });
}
