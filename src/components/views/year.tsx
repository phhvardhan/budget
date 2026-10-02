"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { useData, useUI } from "@/lib/store";
import { useMonth } from "@/lib/hooks";
import { summarize } from "@/lib/calc";
import { BUCKETS, BUCKET_ORDER, OTHER_COLOR } from "@/lib/defaults";
import { formatMoney, formatPct } from "@/lib/format";
import { monthLabel, thisMonth } from "@/lib/dates";
import { PageHeader } from "@/components/shell/page-header";
import { MonthSwitcher } from "@/components/shell/month-switcher";
import { SpotlightCard, CardHeader } from "@/components/ui/spotlight-card";
import { Money } from "@/components/ui/money";
import { Stagger, Rise } from "@/components/ui/motion";
import { cn } from "@/lib/cn";

export function Year() {
  const month = useMonth();
  const year = month.slice(0, 4);
  const entries = useData((s) => s.entries);
  const categories = useData((s) => s.categories);
  const currency = useData((s) => s.settings?.currency ?? "USD");
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`), [year]);
  const data = useMemo(() => months.map((m) => summarize(m, entries, categories)), [months, entries, categories]);
  const active = data.filter((d) => d.count > 0);
  const n = active.length || 1;
  const sum = (f: (d: (typeof data)[number]) => number) => data.reduce((a, d) => a + f(d), 0);
  const totNet = sum((d) => d.net);
  const totSaved = sum((d) => d.totalSaved);
  const avgNeeds = sum((d) => d.buckets.needs) / n;
  const cur = thisMonth();
  const money = (v: number) => formatMoney(v, currency);
  const maxRate = Math.max(0.0001, ...data.map((d) => Math.max(0, d.rate ?? 0)));
  const ctx: RowCtx = { data, cur, n, currency };

  return (
    <>
      <PageHeader
        eyebrow="Year in review"
        title={
          <>
            {year}, month by month
          </>
        }
        right={<MonthSwitcher step={12} mode="year" />}
      />
      <Stagger className="flex flex-col gap-5">
        <Rise className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <SpotlightCard as="div" className="p-5">
            <div className="eyebrow">Take-home {year}</div>
            <Money value={totNet} className="mt-2 block font-serif text-[32px] leading-none text-ivory" />
          </SpotlightCard>
          <SpotlightCard as="div" className="p-5">
            <div className="eyebrow">Kept (saved + left over)</div>
            <Money value={totSaved} className="mt-2 block font-serif text-[32px] leading-none text-gradient-champagne" />
          </SpotlightCard>
          <SpotlightCard as="div" className="p-5">
            <div className="eyebrow">Savings rate</div>
            <div className="mt-2 font-serif text-[32px] leading-none text-ivory">{formatPct(totNet > 0 ? totSaved / totNet : null)}</div>
          </SpotlightCard>
          <SpotlightCard as="div" className="p-5">
            <div className="eyebrow">Emergency fund goal</div>
            <div className="tnum mt-2 font-serif text-[26px] leading-none text-ivory">
              {money(avgNeeds * 3)} <span className="text-dim">–</span> {money(avgNeeds * 6)}
            </div>
            <div className="mt-1.5 text-[11.5px] text-dim">3–6 months of Needs ({money(avgNeeds)}/mo avg)</div>
          </SpotlightCard>
        </Rise>

        <Rise>
          <SpotlightCard className="p-6">
            <CardHeader title="Savings rate by month" hint="Click a month to open it on Overview" />
            <div className="mt-6 grid grid-cols-12 items-end gap-1.5 sm:gap-3" style={{ height: 150 }}>
              {data.map((d, i) => {
                const r = Math.max(0, d.rate ?? 0);
                return (
                  <button
                    key={d.month}
                    type="button"
                    onClick={() => useUI.getState().set({ month: d.month })}
                    className="group flex h-full cursor-pointer flex-col items-center justify-end gap-2"
                    aria-label={`${monthLabel(d.month)}: ${formatPct(d.rate)}`}
                  >
                    <span className="tnum tnum text-[10px] text-dim opacity-0 transition group-hover:opacity-100 sm:opacity-100">{d.rate == null ? "" : `${Math.round(d.rate * 100)}%`}</span>
                    <motion.span
                      className="w-full max-w-[34px] rounded-t-[8px] rounded-b-[3px]"
                      style={{
                        background: d.month === month ? "linear-gradient(180deg,#f3e6cc,#b78a34)" : "linear-gradient(180deg,rgb(230 211 174 / 0.55),rgb(181 134 42 / 0.35))",
                        boxShadow: d.month === month ? "0 0 24px -4px rgb(230 211 174 / 0.6)" : undefined,
                      }}
                      initial={{ height: 0 }}
                      animate={{ height: `${d.rate == null ? 2 : Math.max(3, (r / maxRate) * 100)}px` }}
                      transition={{ type: "spring", stiffness: 120, damping: 18, delay: i * 0.04 }}
                    />
                    <span className={cn("tnum text-[10px]", d.month === month ? "text-ivory" : "text-dim")}>{monthLabel(d.month, "short").slice(0, 3)}</span>
                  </button>
                );
              })}
            </div>
          </SpotlightCard>
        </Rise>

        <Rise>
          <SpotlightCard className="p-6">
            <CardHeader title="The full table" hint={`Averages use the ${active.length} month${active.length === 1 ? "" : "s"} with entries. Red means over that category's budget.`} />
            <div className="no-scrollbar -mx-6 mt-4 overflow-x-auto px-6">
              <table className="w-full min-w-[1040px] border-collapse text-[12.5px]">
                <thead>
                  <tr className="border-b border-line">
                    <th className="sticky left-0 z-[1] bg-[#121118] py-2 text-left" />
                    {months.map((m) => (
                      <th key={m} className={cn("eyebrow px-3 py-2 text-right", m === cur && "bg-champagne/[0.05] text-champagne")}>
                        {monthLabel(m, "short")}
                      </th>
                    ))}
                    <th className="eyebrow px-3 py-2 text-right">Total</th>
                    <th className="eyebrow px-3 py-2 text-right">Avg</th>
                  </tr>
                </thead>
                <tbody className="[&_tr]:border-b [&_tr]:border-line/60">
                  <Section label="Income" />
                  <Row ctx={ctx} label="Gross income" f={(d) => d.gross} />
                  <Row ctx={ctx} label="Taxes & deductions" f={(d) => d.deductions} />
                  <Row ctx={ctx} label="Take-home pay" f={(d) => d.net} strong />
                  <Section label="By bucket" />
                  {BUCKET_ORDER.map((k) => (
                    <Row ctx={ctx} key={k} label={BUCKETS[k].label} swatch={BUCKETS[k].color} f={(d) => d.buckets[k]} />
                  ))}
                  {data.some((d) => d.buckets.other > 0) && <Row ctx={ctx} label="Uncategorized" swatch={OTHER_COLOR} f={(d) => d.buckets.other} />}
                  <Row ctx={ctx} label="Left over" f={(d) => d.leftover} strong />
                  <Row ctx={ctx} label="Savings rate" f={(d) => d.rate} strong fmt={(v) => formatPct(v)} total={formatPct(totNet > 0 ? totSaved / totNet : null)} avg="" />
                  <Section label="By category" />
                  {categories.map((c) => (
                    <tr key={c.id} className="group/tr">
                      <td className="sticky left-0 z-[1] bg-[#121118] py-2.5 pr-4 pl-1 text-left whitespace-nowrap text-mist">
                        <span className="flex items-center gap-2">
                          <i className="inline-block size-1.5 rounded-full" style={{ background: BUCKETS[c.bucket].color }} />
                          {c.name}
                        </span>
                      </td>
                      {data.map((d) => {
                        const v = d.byCategory[c.id] || 0;
                        const over = c.budget > 0 && v > c.budget;
                        return (
                          <td key={d.month} className={cn("tnum px-3 py-2.5 text-right whitespace-nowrap group-hover/tr:bg-white/[0.02]", d.month === cur && "bg-champagne/[0.05]", over ? "font-medium text-bad" : v ? "text-mist" : "text-dim/50")}>
                            {v ? money(v) : "–"}
                          </td>
                        );
                      })}
                      <td className="tnum px-3 py-2.5 text-right whitespace-nowrap text-ivory">{money(sum((d) => d.byCategory[c.id] || 0))}</td>
                      <td className="tnum px-3 py-2.5 text-right whitespace-nowrap text-mist">{money(sum((d) => d.byCategory[c.id] || 0) / n)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SpotlightCard>
        </Rise>
      </Stagger>
    </>
  );
}

type Summary = ReturnType<typeof summarize>;
interface RowCtx {
  data: Summary[];
  cur: string;
  n: number;
  currency: string;
}

function Row({
  ctx,
  label,
  f,
  strong,
  fmt,
  total,
  avg,
  swatch,
}: {
  ctx: RowCtx;
  label: string;
  f: (d: Summary) => number | null;
  strong?: boolean;
  fmt?: (v: number) => string;
  total?: string;
  avg?: string;
  swatch?: string;
}) {
  const { data, cur, n, currency } = ctx;
  const money = (v: number) => formatMoney(v, currency);
  const show = fmt ?? money;
  const sum = data.reduce((a, d) => a + (f(d) ?? 0), 0);
  return (
    <tr className={cn("group/tr", strong && "text-ivory")}>
      <td className="sticky left-0 z-[1] bg-[#121118] py-2.5 pr-4 pl-1 text-left font-medium whitespace-nowrap">
        <span className="flex items-center gap-2">
          {swatch && <i className="inline-block size-2 rounded-[3px]" style={{ background: swatch }} />}
          {label}
        </span>
      </td>
      {data.map((d) => {
        const v = f(d);
        return (
          <td key={d.month} className={cn("tnum px-3 py-2.5 text-right whitespace-nowrap transition-colors group-hover/tr:bg-white/[0.02]", d.month === cur && "bg-champagne/[0.05]", !strong && "text-mist")}>
            {d.count && v != null ? show(v) : <span className="text-dim/50">–</span>}
          </td>
        );
      })}
      <td className="tnum px-3 py-2.5 text-right font-medium whitespace-nowrap text-ivory">{total ?? money(sum)}</td>
      <td className="tnum px-3 py-2.5 text-right whitespace-nowrap text-mist">{avg ?? money(sum / n)}</td>
    </tr>
  );
}

function Section({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={15} className="eyebrow sticky left-0 pt-6 pb-2 text-left !text-champagne/70">
        {label}
      </td>
    </tr>
  );
}
