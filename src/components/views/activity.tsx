"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Download, Search, X } from "lucide-react";
import { useData, useUI } from "@/lib/store";
import { useMonth, useSummary } from "@/lib/hooks";
import { entriesIn, sortEntries } from "@/lib/calc";
import { BUCKETS, BUCKET_ORDER } from "@/lib/defaults";
import { dayLabel, monthLabel } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import type { Entry } from "@/lib/types";
import { PageHeader } from "@/components/shell/page-header";
import { MonthSwitcher } from "@/components/shell/month-switcher";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Money } from "@/components/ui/money";
import { Segmented } from "@/components/ui/segmented";
import { Input, Select } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { Stagger, Rise } from "@/components/ui/motion";
import { EntryRow } from "@/components/entries/entry-row";
import { SampleBanner } from "./sample-banner";

export function Activity() {
  const month = useMonth();
  const s = useSummary(month);
  const entries = useData((x) => x.entries);
  const categories = useData((x) => x.categories);
  const currency = useData((x) => x.settings?.currency ?? "USD");
  const params = useSearchParams();
  const router = useRouter();
  const day = params.get("day");
  const [type, setType] = useState<"all" | "expense" | "income">("all");
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const list = useMemo(() => {
    let l = sortEntries(entriesIn(entries, day ? day.slice(0, 7) : month));
    if (day) l = l.filter((e) => e.date === day);
    if (type !== "all") l = l.filter((e) => e.type === type);
    if (cat) l = l.filter((e) => e.type === "expense" && e.categoryId === cat);
    const t = q.trim().toLowerCase();
    if (t)
      l = l.filter((e) =>
        [e.type === "expense" ? e.description : e.source, e.note, e.type === "expense" ? e.method : "", e.type === "expense" && e.categoryId ? catById.get(e.categoryId)?.name : ""]
          .join(" ")
          .toLowerCase()
          .includes(t),
      );
    return l;
  }, [entries, month, day, type, cat, q, catById]);

  const groups = useMemo(() => {
    const g: { date: string; items: Entry[]; total: number }[] = [];
    for (const e of list) {
      const last = g[g.length - 1];
      const v = e.type === "expense" ? e.amount : 0;
      if (last && last.date === e.date) {
        last.items.push(e);
        last.total += v;
      } else g.push({ date: e.date, items: [e], total: v });
    }
    return g;
  }, [list]);

  const exportCsv = () => {
    const rows = [["Date", "Type", "Category", "Bucket", "Description / Source", "Amount", "Gross", "Deductions", "Paid with", "Note"]];
    for (const e of [...list].reverse()) {
      if (e.type === "income") rows.push([e.date, "Income", "", "", e.source, String(e.gross - e.deductions), String(e.gross), String(e.deductions), "", e.note ?? ""]);
      else {
        const c = e.categoryId ? catById.get(e.categoryId) : undefined;
        rows.push([e.date, "Expense", c?.name ?? "Uncategorized", c ? BUCKETS[c.bucket].label : "", e.description, String(e.amount), "", "", e.method ?? "", e.note ?? ""]);
      }
    }
    const csv = rows.map((r) => r.map((v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `payday-ledger-${day ?? month}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    useUI.getState().toast("CSV downloaded");
  };

  return (
    <>
      <PageHeader eyebrow="Activity" title={<>Every dollar, in and out</>} right={<MonthSwitcher />} />
      <SampleBanner />
      <Stagger className="flex flex-col gap-5">
        <Rise className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {[
            ["Money in", s.net, "text-good"],
            ["Money out", s.outflow, "text-ivory"],
            [s.leftover >= 0 ? "Left over" : "Overspent", Math.abs(s.leftover), s.leftover >= 0 ? "text-gradient-champagne" : "text-bad"],
          ].map(([label, v, cls], i) => (
            <SpotlightCard key={label as string} as="div" className={`p-5 ${i === 2 ? "col-span-2 sm:col-span-1" : ""}`}>
              <div className="eyebrow">{label as string}</div>
              <Money value={v as number} decimals className={`mt-2 block font-serif text-[34px] leading-none ${cls}`} />
            </SpotlightCard>
          ))}
        </Rise>

        <Rise>
          <SpotlightCard className="p-4 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center gap-2.5">
              <Segmented
                label="Show"
                value={type}
                onChange={setType}
                options={[
                  { value: "all", label: "All" },
                  { value: "expense", label: "Expenses" },
                  { value: "income", label: "Income" },
                ]}
              />
              <Select aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)} className="h-11 w-auto max-w-[220px] flex-none">
                <option value="">All categories</option>
                {BUCKET_ORDER.map((b) => (
                  <optgroup key={b} label={BUCKETS[b].label}>
                    {categories
                      .filter((c) => c.bucket === b)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </Select>
              <div className="relative min-w-[180px] flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-dim" />
                <Input aria-label="Search" placeholder="Search descriptions" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
              </div>
              <Button variant="secondary" onClick={exportCsv} disabled={!list.length} className="h-11">
                <Download /> CSV
              </Button>
            </div>

            <AnimatePresence>
              {day && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4">
                  <button
                    type="button"
                    onClick={() => router.replace("/activity")}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-champagne/30 bg-champagne/10 px-3 py-1.5 text-[12.5px] text-champagne"
                  >
                    Showing {dayLabel(day)} <X className="size-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {list.length === 0 ? (
              <div className="py-14 text-center">
                <div className="font-serif text-[28px] text-ivory">{entriesIn(entries, month).length ? "No matches" : `Nothing logged for ${monthLabel(month)}`}</div>
                <p className="mt-2 text-[13px] text-dim">
                  {entriesIn(entries, month).length ? "Try a different filter." : "Press ⌘K (or the + button) and type something like “lunch 14”."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                <AnimatePresence initial={false}>
                  {groups.map((g) => (
                    <motion.div key={g.date} layout className="mb-3">
                      <div className="sticky top-0 z-[1] -mx-1 flex items-baseline justify-between bg-[linear-gradient(180deg,rgb(17_16_22/0.96),rgb(17_16_22/0.85))] px-1 py-2 backdrop-blur">
                        <span className="eyebrow">{dayLabel(g.date)}</span>
                        {g.total > 0 && <span className="tnum font-mono text-[11px] text-dim">−{formatMoney(g.total, currency, true)}</span>}
                      </div>
                      <AnimatePresence initial={false}>
                        {g.items.map((e) => (
                          <EntryRow key={e.id} entry={e} category={e.type === "expense" && e.categoryId ? catById.get(e.categoryId) : undefined} currency={currency} showDate={false} />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </SpotlightCard>
        </Rise>
      </Stagger>
    </>
  );
}
