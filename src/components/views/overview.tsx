"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, CalendarClock, Plus } from "lucide-react";
import { useData, useUI } from "@/lib/store";
import { useMonth, useSummary, useTrailing, openEntry, setMonth } from "@/lib/hooks";
import { billStates, bucketBudgets, budgetState, dailySpending, entriesIn, sortEntries, targetsOf } from "@/lib/calc";
import { BUCKETS, BUCKET_ORDER, LEFTOVER_COLOR, OTHER_COLOR } from "@/lib/defaults";
import { formatMoney, formatPct } from "@/lib/format";
import { monthLabel, thisMonth } from "@/lib/dates";
import { PageHeader } from "@/components/shell/page-header";
import { MonthSwitcher } from "@/components/shell/month-switcher";
import { SpotlightCard, CardHeader } from "@/components/ui/spotlight-card";
import { HeroMoney, Money } from "@/components/ui/money";
import { Button } from "@/components/ui/button";
import { Stagger, Rise, Meter } from "@/components/ui/motion";
import { Status } from "@/components/ui/status";
import { PaycheckFlow } from "@/components/charts/paycheck-flow";
import { TrendChart } from "@/components/charts/trend-chart";
import { SavingsRing } from "@/components/charts/savings-ring";
import { SpendCalendar } from "@/components/charts/spend-calendar";
import { EntryRow } from "@/components/entries/entry-row";
import { SampleBanner } from "./sample-banner";

export function Overview() {
  const month = useMonth();
  const s = useSummary(month);
  const trailing = useTrailing(month);
  const settings = useData((x) => x.settings)!;
  const categories = useData((x) => x.categories);
  const entries = useData((x) => x.entries);
  const bills = useData((x) => x.bills);
  const currency = settings.currency;
  const takeHome = settings.takeHome;
  const base = s.hasIncome ? s.net : takeHome;
  const targets = targetsOf(settings);
  const budgets = bucketBudgets(categories);
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const watch = useMemo(
    () =>
      categories
        .map((c) => {
          const spent = s.byCategory[c.id] || 0;
          return { c, spent, used: c.budget > 0 ? spent / c.budget : spent > 0 ? Infinity : 0 };
        })
        .filter((x) => x.c.budget > 0 || x.spent > 0)
        .sort((a, b) => b.used - a.used)
        .slice(0, 6),
    [categories, s],
  );
  const recent = useMemo(() => sortEntries(entriesIn(entries, month)).slice(0, 6), [entries, month]);
  const due = useMemo(() => billStates(month, bills, entries).filter((b) => b.state.kind !== "paid").slice(0, 4), [month, bills, entries]);
  const days = useMemo(() => dailySpending(month, entries), [month, entries]);
  const isNow = month === thisMonth();

  const flow = [
    { k: "needs", label: "Needs", v: s.buckets.needs, color: BUCKETS.needs.color },
    { k: "wants", label: "Wants", v: s.buckets.wants, color: BUCKETS.wants.color },
    { k: "savings", label: "Saved & invested", v: s.buckets.savings, color: BUCKETS.savings.color },
    ...(s.buckets.other > 0 ? [{ k: "other", label: "Uncategorized", v: s.buckets.other, color: OTHER_COLOR }] : []),
  ];

  return (
    <>
      <PageHeader
        eyebrow={isNow ? new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "Looking back"}
        title={
          <>
            {monthLabel(month, "long")} <span className="text-dim">{month.slice(0, 4)}</span>
          </>
        }
        right={<MonthSwitcher />}
      />
      <SampleBanner />

      <Stagger className="grid grid-cols-12 gap-4 lg:gap-5">
        {/* Hero ----------------------------------------------------------------- */}
        <Rise className="col-span-12 xl:order-1 xl:col-span-8">
          <SpotlightCard className="h-full p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="eyebrow">{s.hasIncome ? "Take-home pay" : "Expected take-home"}</div>
                <HeroMoney value={base} className="mt-3 font-serif text-[64px] leading-[0.9] tracking-[-0.03em] text-ivory sm:text-[88px]" />
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-mist">
                  {s.hasIncome ? (
                    <>
                      <span>
                        Gross <Money value={s.gross} className="text-ivory" />
                      </span>
                      <span>
                        Taxes &amp; deductions <Money value={s.deductions} className="text-ivory" />
                      </span>
                    </>
                  ) : (
                    <span className="flex items-center gap-3">
                      No paycheck logged for {monthLabel(month, "long")} yet.
                      <Button variant="link" onClick={() => openEntry("income")}>
                        Log a paycheck
                      </Button>
                    </span>
                  )}
                </div>
              </div>
              <Button variant="primary" onClick={() => useUI.getState().set({ quickAdd: true })} className="hidden sm:inline-flex">
                <Plus /> Quick add
              </Button>
            </div>

            <div className="mt-8">
              <div className="flex h-[6px] gap-[2px] overflow-hidden rounded-full bg-white/[0.04]">
                {(() => {
                  const scale = Math.max(base, s.outflow) || 1;
                  const segs = [
                    ...flow.filter((f) => f.v > 0).map((f) => ({ key: f.k, w: f.v / scale, style: { background: f.color }, cls: "" })),
                    ...(base - s.outflow > 0 ? [{ key: "left", w: (base - s.outflow) / scale, style: {}, cls: "hatch" }] : []),
                  ];
                  return segs.map((g, i) => (
                    <motion.div
                      key={g.key}
                      className={`h-full min-w-[3px] rounded-full ${g.cls}`}
                      style={g.style}
                      initial={{ width: 0 }}
                      animate={{ width: `${g.w * 100}%` }}
                      transition={{ type: "spring", stiffness: 90, damping: 20, delay: 0.25 + i * 0.08 }}
                    />
                  ));
                })()}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
                {flow.map((f) => (
                  <div key={f.k} className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[12px] text-mist">
                      <i className="inline-block size-2 rounded-[3px]" style={{ background: f.color }} />
                      {f.label}
                    </div>
                    <Money value={f.v} className="mt-1 block font-serif text-[28px] leading-none text-ivory" />
                    <div className="tnum mt-1 text-[11.5px] text-dim">{base > 0 ? `${formatPct(f.v / base)} of pay` : " "}</div>
                  </div>
                ))}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[12px] text-mist">
                    <i className="hatch inline-block size-2 rounded-[3px] ring-1 ring-white/20" style={{ background: s.leftover < 0 && s.hasIncome ? "#ee8a84" : undefined }} />
                    {base - s.outflow >= 0 ? "Left over" : "Overspent"}
                  </div>
                  <Money value={Math.abs(base - s.outflow)} className={`mt-1 block font-serif text-[28px] leading-none ${base - s.outflow < 0 ? "text-bad" : "text-gradient-champagne"}`} />
                  <div className="mt-1 text-[11.5px] text-dim">{base - s.outflow >= 0 ? "Sweep it into savings" : "More than came in"}</div>
                </div>
              </div>
            </div>
          </SpotlightCard>
        </Rise>

        {/* Savings rate -------------------------------------------------------- */}
        <Rise className="col-span-12 sm:col-span-6 xl:order-1 xl:col-span-4">
          <SpotlightCard className="flex h-full flex-col items-center justify-between gap-5 p-6 text-center" glow="181 134 42">
            <CardHeader title="Savings rate" hint={`Your target is ${formatPct(targets.savings)}, marked on the ring`} className="w-full text-left" />
            <SavingsRing rate={s.rate} target={targets.savings} />
            <p className="max-w-[30ch] text-[13px] text-mist">
              {s.rate == null ? (
                "Log this month's pay to see how much you keep."
              ) : (
                <>
                  You kept <span className="text-ivory">{formatMoney(Math.max(0, s.rate) * 100, currency)}</span> of every{" "}
                  <span className="text-ivory">{formatMoney(100, currency)}</span> you took home.
                </>
              )}
            </p>
          </SpotlightCard>
        </Rise>

        {/* 50/30/20 on small screens sits beside the ring */}
        <Rise className="col-span-12 sm:col-span-6 xl:order-3 xl:col-span-4">
          <SpotlightCard className="h-full p-6">
            <CardHeader title="50 / 30 / 20 check" hint="Bars are this month; the mark is your target" />
            <div className="mt-6 flex flex-col gap-6">
              {BUCKET_ORDER.map((k, i) => {
                const share = base > 0 ? s.buckets[k] / base : 0;
                const t = targets[k];
                const status = !s.hasIncome ? (
                  <Status tone="muted" icon={false}>
                    No pay yet
                  </Status>
                ) : k === "savings" ? (
                  share >= t ? <Status tone="good">On track</Status> : <Status tone="warn">Below target</Status>
                ) : share > t ? (
                  <Status tone="bad">Above target</Status>
                ) : (
                  <Status tone="good">On track</Status>
                );
                return (
                  <div key={k}>
                    <div className="mb-2.5 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-[13.5px] font-medium text-ivory">
                        <i className="inline-block size-2 rounded-[3px]" style={{ background: BUCKETS[k].color }} />
                        {BUCKETS[k].label}
                      </span>
                      {status}
                    </div>
                    <div className="relative">
                      <Meter value={share} color={BUCKETS[k].color} height={4} delay={0.2 + i * 0.1} />
                      <span className="absolute -top-[4px] h-3 w-px bg-ivory/80" style={{ left: `${Math.min(t, 1) * 100}%` }} />
                    </div>
                    <div className="tnum mt-2 flex justify-between text-[11.5px] text-dim">
                      <span>
                        <span className="text-mist">{formatPct(share)}</span>, {formatMoney(s.buckets[k], currency)}
                      </span>
                      <span>
                        target {formatPct(t)}, {formatMoney(budgets[k], currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SpotlightCard>
        </Rise>

        {/* Paycheck flow -------------------------------------------------------- */}
        <Rise className="col-span-12 xl:order-2">
          <SpotlightCard className="p-6 sm:p-7">
            <CardHeader
              title="Where your paycheck went"
              hint="Hover a stream to trace it."
              action={
                <div className="flex flex-wrap gap-3 text-[11.5px] text-mist">
                  {BUCKET_ORDER.map((b) => (
                    <span key={b} className="flex items-center gap-1.5">
                      <i className="inline-block size-2 rounded-[3px]" style={{ background: BUCKETS[b].color }} />
                      {BUCKETS[b].short}
                    </span>
                  ))}
                  <span className="flex items-center gap-1.5">
                    <i className="inline-block size-2 rounded-[3px]" style={{ background: LEFTOVER_COLOR }} /> Left over
                  </span>
                </div>
              }
            />
            <div className="mt-6">
              <PaycheckFlow summary={s} categories={categories} takeHome={takeHome} currency={currency} />
            </div>
          </SpotlightCard>
        </Rise>

        {/* Budgets to watch ------------------------------------------------------ */}
        <Rise className="col-span-12 lg:col-span-7 xl:order-3 xl:col-span-4">
          <SpotlightCard className="h-full p-6">
            <CardHeader
              title="Budgets to watch"
              hint="Closest to their limit first"
              action={
                <Link href="/budget" className="flex items-center gap-1 text-[12.5px] text-champagne hover:text-ivory">
                  All <ArrowUpRight className="size-3.5" />
                </Link>
              }
            />
            <div className="mt-5 flex flex-col gap-4">
              {watch.length === 0 && <p className="py-6 text-center text-[13px] text-dim">No spending logged yet this month.</p>}
              {watch.map(({ c, spent }, i) => {
                const st = budgetState(spent, c.budget);
                const color = st === "over" ? "#ff7d7d" : BUCKETS[c.bucket].color;
                return (
                  <div key={c.id}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="truncate text-[13.5px] text-ivory">{c.name}</span>
                      <span className="tnum shrink-0 text-[12.5px] text-dim">
                        <span className="text-ivory">{formatMoney(spent, currency)}</span> / {formatMoney(c.budget, currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Meter value={c.budget > 0 ? spent / c.budget : 1} color={color} className="flex-1" delay={0.1 + i * 0.06} />
                      <BudgetPill state={st} left={c.budget - spent} currency={currency} />
                    </div>
                  </div>
                );
              })}
            </div>
          </SpotlightCard>
        </Rise>

        {/* Calendar ----------------------------------------------------------------- */}
        <Rise className="col-span-12 lg:col-span-5 xl:order-3 xl:col-span-4">
          <SpotlightCard className="h-full p-6">
            <CardHeader title="Spending by day" hint="Tap a day to see what went out" />
            <div className="mt-5">
              <SpendCalendar month={month} days={days} currency={currency} />
            </div>
          </SpotlightCard>
        </Rise>

        {/* Trend ----------------------------------------------------------------- */}
        <Rise className="col-span-12 xl:order-4 xl:col-span-8">
          <SpotlightCard className="h-full p-6">
            <CardHeader
              title="Twelve months"
              hint="Click a month to open it"
              action={
                <div className="flex flex-wrap gap-3 text-[11.5px] text-mist">
                  {BUCKET_ORDER.map((b) => (
                    <span key={b} className="flex items-center gap-1.5">
                      <i className="inline-block size-2 rounded-[3px]" style={{ background: BUCKETS[b].color }} />
                      {BUCKETS[b].short}
                    </span>
                  ))}
                  <span className="flex items-center gap-1.5">
                    <i className="inline-block h-[2px] w-3 rounded-full bg-champagne" /> Take-home
                  </span>
                </div>
              }
            />
            <div className="mt-5">
              <TrendChart data={trailing} selected={month} currency={currency} onSelect={setMonth} />
            </div>
          </SpotlightCard>
        </Rise>

        {/* Bills ------------------------------------------------------------------ */}
        <Rise className="col-span-12 lg:col-span-5 xl:order-4 xl:col-span-4">
          <SpotlightCard className="h-full p-6">
            <CardHeader
              title="Bills due"
              action={
                <Link href="/bills" className="flex items-center gap-1 text-[12.5px] text-champagne hover:text-ivory">
                  All <ArrowUpRight className="size-3.5" />
                </Link>
              }
            />
            <div className="mt-4 flex flex-col">
              {bills.length === 0 ? (
                <div className="py-6 text-center">
                  <CalendarClock className="mx-auto mb-2 size-6 text-dim" />
                  <p className="text-[13px] text-dim">Add rent, phone and subscriptions so nothing slips.</p>
                  <Link href="/bills" className="mt-3 inline-block text-[12.5px] text-champagne">
                    Add bills
                  </Link>
                </div>
              ) : due.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-dim">Every bill is logged for {monthLabel(month, "long")}. Nice.</p>
              ) : (
                due.map(({ bill, day, state }) => (
                  <div key={bill.id} className="flex items-center gap-3 border-t border-line py-3 first:border-t-0">
                    <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-white/[0.03] leading-none">
                      <span className="tnum font-serif text-[20px] text-ivory">{day}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] text-ivory">{bill.name}</div>
                      <div className="tnum text-[12px] text-dim">{bill.amount ? formatMoney(bill.amount, currency, true) : "Amount varies"}</div>
                    </div>
                    <BillPill state={state} />
                  </div>
                ))
              )}
            </div>
          </SpotlightCard>
        </Rise>

        {/* Recent --------------------------------------------------------------- */}
        <Rise className="col-span-12 lg:col-span-7 xl:order-5 xl:col-span-12">
          <SpotlightCard className="h-full p-6">
            <CardHeader
              title="Recent activity"
              action={
                <Link href="/activity" className="flex items-center gap-1 text-[12.5px] text-champagne hover:text-ivory">
                  See all <ArrowUpRight className="size-3.5" />
                </Link>
              }
            />
            <div className="mt-3">
              {recent.length === 0 ? (
                <div className="py-8 text-center text-[13px] text-dim">
                  Nothing logged for {monthLabel(month)}.{" "}
                  <button type="button" className="cursor-pointer text-champagne" onClick={() => useUI.getState().set({ quickAdd: true })}>
                    Add the first entry
                  </button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {recent.map((e) => (
                    <EntryRow key={e.id} entry={e} category={e.type === "expense" && e.categoryId ? catById.get(e.categoryId) : undefined} currency={currency} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </SpotlightCard>
        </Rise>
      </Stagger>
    </>
  );
}

export function BudgetPill({ state, left, currency }: { state: ReturnType<typeof budgetState>; left: number; currency: string }) {
  if (state === "over") return <Status tone="bad">Over {formatMoney(-left, currency)}</Status>;
  if (state === "full") return <Status tone="info">Fully used</Status>;
  if (state === "near") return <Status tone="warn">{formatMoney(left, currency)} left</Status>;
  if (state === "unbudgeted") return <Status tone="warn">No budget</Status>;
  if (state === "idle") return <Status tone="muted" icon={false}>—</Status>;
  return <Status tone="good">{formatMoney(left, currency)} left</Status>;
}

export function BillPill({ state }: { state: ReturnType<typeof billStates>[number]["state"] }) {
  if (state.kind === "paid") return <Status tone="good">Paid</Status>;
  if (state.kind === "missed") return <Status tone="warn">Not logged</Status>;
  if (state.kind === "upcoming") return <Status tone="muted" icon="clock">Upcoming</Status>;
  if (state.kind === "overdue") return <Status tone="bad">{state.days}d overdue</Status>;
  if (state.days === 0) return <Status tone="warn" icon="clock">Due today</Status>;
  return <Status tone={state.days <= 5 ? "warn" : "muted"} icon="clock">In {state.days}d</Status>;
}
