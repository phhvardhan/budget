"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, CalendarClock, Plus } from "lucide-react";
import { useData, useUI } from "@/lib/store";
import { useMonth, useSummary, useTrailing, openEntry, setMonth } from "@/lib/hooks";
import { billStates, budgetState, dailySpending, entriesIn, sortEntries, targetsOf } from "@/lib/calc";
import { BUCKETS, BUCKET_ORDER, LEFTOVER_COLOR } from "@/lib/defaults";
import { formatMoney, formatPct } from "@/lib/format";
import { monthLabel } from "@/lib/dates";
import type { Bucket, Category, MonthSummary } from "@/lib/types";
import { MonthSwitcher } from "@/components/shell/month-switcher";
import { Button } from "@/components/ui/button";
import { Status } from "@/components/ui/status";
import { PaycheckFlow } from "@/components/charts/paycheck-flow";
import { TrendChart } from "@/components/charts/trend-chart";
import { SpendCalendar } from "@/components/charts/spend-calendar";
import { EntryRow } from "@/components/entries/entry-row";
import { Envelope, readEnvelope, type EnvelopeData } from "@/components/envelopes/envelope";
import { SampleBanner } from "./sample-banner";
import { cn } from "@/lib/cn";

export function Overview() {
  const month = useMonth();
  const s = useSummary(month);
  const trailing = useTrailing(month);
  const settings = useData((x) => x.settings)!;
  const categories = useData((x) => x.categories);
  const entries = useData((x) => x.entries);
  const bills = useData((x) => x.bills);
  const currency = settings.currency;
  const base = s.hasIncome ? s.net : settings.takeHome;
  const targets = targetsOf(settings);
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const [open, setOpen] = useState<string | null>(null);

  const shelves = useMemo(() => {
    const sorted = [...categories].sort((a, b) => a.sort - b.sort);
    return BUCKET_ORDER.map((bucket) => ({
      bucket,
      envelopes: sorted
        .filter((c) => c.bucket === bucket)
        .map((c): EnvelopeData => ({ id: c.id, name: c.name, bucket, budget: c.budget, spent: s.byCategory[c.id] || 0 }))
        .filter((e) => e.budget > 0 || e.spent > 0),
    })).filter((x) => x.envelopes.length > 0);
  }, [categories, s]);

  const recent = useMemo(() => sortEntries(entriesIn(entries, month)).slice(0, 6), [entries, month]);
  const due = useMemo(() => billStates(month, bills, entries).filter((b) => b.state.kind !== "paid").slice(0, 5), [month, bills, entries]);
  const days = useMemo(() => dailySpending(month, entries), [month, entries]);

  // Where each shelf starts in the overall order, so the drop-in plays left to right, top to bottom.
  const starts = shelves.map((_, i) => shelves.slice(0, i).reduce((a, x) => a + x.envelopes.length, 0));

  return (
    <>
      <Headline s={s} base={base} month={month} currency={currency} savingsTarget={targets.savings} />
      <SampleBanner />

      {/* The envelopes ------------------------------------------------------------- */}
      <div className="flex flex-col gap-10">
        {shelves.map(({ bucket, envelopes }, si) => {
          const openHere = envelopes.find((e) => e.id === open);
          return (
            <section key={bucket} aria-labelledby={`shelf-${bucket}`}>
              <ShelfHeader bucket={bucket} s={s} base={base} target={targets[bucket]} budget={envelopes.reduce((a, e) => a + e.budget, 0)} currency={currency} />
              <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pt-1 pb-3 sm:mx-0 sm:grid sm:grid-cols-[repeat(auto-fill,minmax(138px,1fr))] sm:gap-x-3.5 sm:gap-y-7 sm:overflow-visible sm:px-0">
                {envelopes.map((e, ei) => (
                  <div key={e.id} className="w-[46%] max-w-[210px] shrink-0 snap-start sm:w-auto sm:max-w-none">
                    <Envelope data={e} currency={currency} index={starts[si] + ei} selected={open === e.id} onSelect={() => setOpen(open === e.id ? null : e.id)} />
                  </div>
                ))}
              </div>
              <AnimatePresence initial={false}>
                {openHere && (
                  <EnvelopeContents
                    key={openHere.id}
                    data={openHere}
                    category={catById.get(openHere.id)!}
                    month={month}
                    currency={currency}
                    onClose={() => setOpen(null)}
                  />
                )}
              </AnimatePresence>
            </section>
          );
        })}
        {shelves.length === 0 && (
          <div className="rounded-[var(--radius-card)] border border-dashed border-line-2 px-6 py-10 text-center text-[14px] text-mist">
            No envelopes yet. Give your categories a budget and each one gets an envelope here.{" "}
            <Link href="/budget" className="text-champagne hover:text-ivory">
              Set budgets
            </Link>
          </div>
        )}
      </div>

      {/* Below the envelopes: quiet sections, no cards ----------------------------------- */}
      <div className="mt-16 grid grid-cols-12 gap-x-10 gap-y-14">
        <Section
          className="col-span-12 lg:col-span-5"
          title="Coming up"
          action={
            <Link href="/bills" className="flex items-center gap-1 text-[13px] text-champagne hover:text-ivory">
              All bills <ArrowUpRight className="size-3.5" />
            </Link>
          }
        >
          {bills.length === 0 ? (
            <Empty icon={<CalendarClock className="size-5" />}>
              Add rent, phone and subscriptions so nothing slips.{" "}
              <Link href="/bills" className="text-champagne">
                Add bills
              </Link>
            </Empty>
          ) : due.length === 0 ? (
            <Empty>Every bill is logged for {monthLabel(month, "long")}.</Empty>
          ) : (
            <ol className="flex flex-col">
              {due.map(({ bill, day, state }) => (
                <li key={bill.id} className="flex items-center gap-4 border-t border-line py-3 first:border-t-0">
                  <span className="font-serif w-8 shrink-0 text-right text-[28px] leading-none text-ivory/90">{day}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] text-ivory">{bill.name}</div>
                    <div className="text-[12.5px] text-dim">{bill.amount ? formatMoney(bill.amount, currency, true) : "Amount varies"}</div>
                  </div>
                  <BillPill state={state} />
                </li>
              ))}
            </ol>
          )}
        </Section>

        <Section
          className="col-span-12 lg:col-span-7"
          title="Latest"
          action={
            <Link href="/activity" className="flex items-center gap-1 text-[13px] text-champagne hover:text-ivory">
              All activity <ArrowUpRight className="size-3.5" />
            </Link>
          }
        >
          {recent.length === 0 ? (
            <Empty>
              Nothing logged for {monthLabel(month)}.{" "}
              <button type="button" className="cursor-pointer text-champagne" onClick={() => useUI.getState().set({ quickAdd: true })}>
                Add the first entry
              </button>
            </Empty>
          ) : (
            <AnimatePresence initial={false}>
              {recent.map((e) => (
                <EntryRow key={e.id} entry={e} category={e.type === "expense" && e.categoryId ? catById.get(e.categoryId) : undefined} currency={currency} />
              ))}
            </AnimatePresence>
          )}
        </Section>

        <Section
          className="col-span-12"
          title="Where the paycheck went"
          hint="Hover a stream to trace it."
          action={<Legend withLeftover />}
        >
          <div className="pt-2">
            <PaycheckFlow summary={s} categories={categories} takeHome={settings.takeHome} currency={currency} />
          </div>
        </Section>

        <Section className="col-span-12 xl:col-span-8" title="Twelve months" hint="Click a month to open it." action={<Legend withTakeHome />}>
          <TrendChart data={trailing} selected={month} currency={currency} onSelect={setMonth} />
        </Section>

        <Section className="col-span-12 md:col-span-7 xl:col-span-4" title="Day by day" hint="Tap a day to see what went out.">
          <SpendCalendar month={month} days={days} currency={currency} />
        </Section>
      </div>
    </>
  );
}

/* Headline ----------------------------------------------------------------------- */

function Headline({ s, base, month, currency, savingsTarget }: { s: MonthSummary; base: number; month: string; currency: string; savingsTarget: number }) {
  const left = base - s.outflow;
  const fig = "font-serif text-ivory [font-variant-numeric:proportional-nums_lining-nums]";
  return (
    <header className="mb-10 lg:mb-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <MonthSwitcher />
        <Button variant="primary" onClick={() => useUI.getState().set({ quickAdd: true })} className="hidden sm:inline-flex">
          <Plus /> Add an entry
        </Button>
      </div>
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="display max-w-[25ch] text-[40px] text-balance text-ivory/80 sm:text-[56px] xl:text-[64px]"
      >
        {s.hasIncome ? (
          <>
            <span className={fig}>{formatMoney(base, currency)}</span> came in for {monthLabel(month, "long")}.{" "}
            {left >= 0 ? (
              <>
                <span className={fig}>{formatMoney(left, currency)}</span> of it hasn&apos;t been spent yet.
              </>
            ) : (
              <>
                You&apos;ve spent <span className={cn(fig, "!text-bad")}>{formatMoney(-left, currency)}</span> more than that.
              </>
            )}
          </>
        ) : (
          <>Nothing has come in for {monthLabel(month, "long")} yet.</>
        )}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="mt-5 max-w-[62ch] text-[15px] leading-relaxed text-mist"
      >
        {s.hasIncome ? (
          <>
            Gross pay was {formatMoney(s.gross, currency)}, and {formatMoney(s.deductions, currency)} went to taxes and deductions.{" "}
            {s.rate != null && (
              <>
                You kept <span className="text-ivory">{formatMoney(Math.max(0, s.rate) * 100, currency)}</span> of every {formatMoney(100, currency)}; the
                goal is {formatMoney(savingsTarget * 100, currency)}.
              </>
            )}
          </>
        ) : (
          <>
            Log your paycheck and your envelopes fill up for the month.{" "}
            <Button variant="link" onClick={() => openEntry("income")}>
              Log a paycheck
            </Button>
          </>
        )}
      </motion.p>
    </header>
  );
}

/* Shelves ------------------------------------------------------------------------- */

const AIM: Record<Bucket, (t: string) => string> = {
  needs: (t) => `aim for ${t} or less`,
  wants: (t) => `aim for ${t} or less`,
  savings: (t) => `aim for ${t} or more`,
};

function ShelfHeader({ bucket, s, base, target, budget, currency }: { bucket: Bucket; s: MonthSummary; base: number; target: number; budget: number; currency: string }) {
  const amt = s.buckets[bucket];
  const share = base > 0 ? amt / base : 0;
  const off = s.hasIncome && (bucket === "savings" ? share < target : share > target);
  const verb = bucket === "savings" ? "put away" : "spent";
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
      <h2 id={`shelf-${bucket}`} className="flex items-center gap-2.5 text-[22px] font-semibold tracking-[-0.02em] text-ivory [font-stretch:88%]">
        <span className="h-[3px] w-5 rounded-full" style={{ background: BUCKETS[bucket].color }} />
        {BUCKETS[bucket].label}
      </h2>
      <p className="text-[13.5px] text-mist">
        <span className="text-ivory">{formatMoney(amt, currency)}</span> {verb} of {formatMoney(budget, currency)} budgeted.
        {s.hasIncome && base > 0 && (
          <>
            {" "}
            <span className={off ? (bucket === "savings" ? "text-warn" : "text-bad") : "text-ivory"}>{formatPct(share)} of pay</span>, {AIM[bucket](formatPct(target))}.
          </>
        )}
      </p>
    </div>
  );
}

function EnvelopeContents({ data, category, month, currency, onClose }: { data: EnvelopeData; category: Category; month: string; currency: string; onClose: () => void }) {
  const entries = useData((x) => x.entries);
  const list = useMemo(
    () => sortEntries(entriesIn(entries, month).filter((e) => e.type === "expense" && e.categoryId === data.id)),
    [entries, month, data.id],
  );
  const r = readEnvelope(data, currency);
  const saving = data.bucket === "savings";
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 32 }}
      className="overflow-hidden"
    >
      <div
        className="mt-3 rounded-[var(--radius-card)] p-5 sm:p-6"
        style={{ background: `color-mix(in oklab, ${BUCKETS[data.bucket].color} 9%, #121016)`, boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${BUCKETS[data.bucket].color} 22%, transparent)` }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-[18px] font-semibold tracking-[-0.015em] text-ivory">{data.name}</h3>
            <p className="mt-0.5 text-[13.5px] text-mist">
              {saving
                ? `${formatMoney(data.spent, currency, true)} put in this month${data.budget > 0 ? ` toward ${formatMoney(data.budget, currency)}` : ""}.`
                : r.over
                  ? `${formatMoney(data.spent, currency, true)} spent against ${formatMoney(data.budget, currency)}. Move money from another envelope or raise the budget.`
                  : `${formatMoney(data.spent, currency, true)} spent, ${r.amount} ${r.caption}.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => openEntry("expense", undefined, { categoryId: category.id })}>
              <Plus /> {saving ? "Put money in" : "Log spending"}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        <div className="mt-4">
          {list.length === 0 ? (
            <p className="py-3 text-[13.5px] text-dim">{saving ? "Nothing put in yet this month." : "Nothing has come out of this envelope yet."}</p>
          ) : (
            list.map((e) => <EntryRow key={e.id} entry={e} category={category} currency={currency} />)
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* Small pieces -------------------------------------------------------------------- */

function Section({ title, hint, action, className, children }: { title: string; hint?: string; action?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("min-w-0 border-t border-line-2 pt-5", className)}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h2 className="text-[19px] font-semibold tracking-[-0.02em] text-ivory [font-stretch:90%]">{title}</h2>
          {hint && <p className="text-[13px] text-dim">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-4 text-[14px] text-mist">
      {icon && <span className="text-dim">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}

function Legend({ withLeftover, withTakeHome }: { withLeftover?: boolean; withTakeHome?: boolean }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-mist">
      {BUCKET_ORDER.map((b) => (
        <span key={b} className="flex items-center gap-1.5">
          <i className="inline-block h-[3px] w-3 rounded-full" style={{ background: BUCKETS[b].color }} />
          {BUCKETS[b].short}
        </span>
      ))}
      {withLeftover && (
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-[3px] w-3 rounded-full" style={{ background: LEFTOVER_COLOR }} /> Left over
        </span>
      )}
      {withTakeHome && (
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-[2px] w-3 rounded-full bg-champagne" /> Take-home
        </span>
      )}
    </div>
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
