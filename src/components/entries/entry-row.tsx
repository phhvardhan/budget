"use client";

import { forwardRef } from "react";
import { motion } from "motion/react";
import { ArrowDownLeft } from "lucide-react";
import type { Category, Entry } from "@/lib/types";
import { BUCKETS, OTHER_COLOR } from "@/lib/defaults";
import { formatMoney } from "@/lib/format";
import { dayLabel } from "@/lib/dates";
import { openEntry } from "@/lib/hooks";

export const EntryRow = forwardRef<
  HTMLButtonElement,
  { entry: Entry; category?: Category; currency: string; showDate?: boolean }
>(function EntryRow({ entry: e, category, currency, showDate = true }, ref) {
  const isIncome = e.type === "income";
  const color = isIncome ? "#7fd8a9" : category ? BUCKETS[category.bucket].color : OTHER_COLOR;
  const title = isIncome ? e.source : e.description || category?.name || "Expense";
  const meta = isIncome
    ? [showDate && dayLabel(e.date), e.deductions ? `gross ${formatMoney(e.gross, currency, true)}` : null, e.note]
    : [category?.name ?? "Uncategorized", showDate && dayLabel(e.date), e.method];
  const amount = isIncome ? e.gross - (e.deductions || 0) : e.amount;

  return (
    <motion.button
      ref={ref}
      layout
      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, x: -24, filter: "blur(4px)", transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      type="button"
      onClick={() => openEntry(e.type, e)}
      className="group/row -mx-3 flex w-[calc(100%+24px)] cursor-pointer items-center gap-3.5 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
    >
      <span
        className="relative grid size-9 shrink-0 place-items-center rounded-[9px]"
        style={{ background: `color-mix(in oklab, ${color} 16%, #15131a)`, boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color} 28%, transparent)` }}
      >
        {isIncome ? (
          <ArrowDownLeft className="size-4 text-good" strokeWidth={2.2} />
        ) : (
          <span className="h-[3px] w-3.5 rounded-full" style={{ background: color }} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[14px] font-medium text-ivory">{title}</span>
          {e.isSample && (
            <span className="shrink-0 rounded-[5px] border border-champagne/25 px-1.5 py-px text-[10.5px] text-champagne/90">
              Sample
            </span>
          )}
        </span>
        <span className="block truncate text-[12px] text-dim">{meta.filter(Boolean).join(", ")}</span>
      </span>
      <span className={`font-serif shrink-0 text-[17px] ${isIncome ? "text-good" : "text-ivory"}`}>
        {isIncome ? "+" : ""}
        {formatMoney(amount, currency, true)}
      </span>
    </motion.button>
  );
});
