"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Pencil, Plus, Zap } from "lucide-react";
import { useData } from "@/lib/store";
import { useMonth, openBill, openEntry } from "@/lib/hooks";
import { billStates } from "@/lib/calc";
import { BUCKETS, OTHER_COLOR } from "@/lib/defaults";
import { formatMoney } from "@/lib/format";
import { daysInMonth, monthLabel, thisMonth, todayKey } from "@/lib/dates";
import { PageHeader } from "@/components/shell/page-header";
import { MonthSwitcher } from "@/components/shell/month-switcher";
import { SpotlightCard, CardHeader } from "@/components/ui/spotlight-card";
import { Money } from "@/components/ui/money";
import { Button } from "@/components/ui/button";
import { Stagger, Rise } from "@/components/ui/motion";
import { BillPill } from "./overview";
import { SampleBanner } from "./sample-banner";

export function Bills() {
  const month = useMonth();
  const bills = useData((s) => s.bills);
  const entries = useData((s) => s.entries);
  const categories = useData((s) => s.categories);
  const currency = useData((s) => s.settings?.currency ?? "USD");
  const rows = useMemo(() => billStates(month, bills, entries), [month, bills, entries]);
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const total = bills.reduce((a, b) => a + (b.amount || 0), 0);
  const paid = rows.filter((r) => r.state.kind === "paid").length;
  const auto = bills.filter((b) => b.autopay).length;
  const progress = bills.length ? paid / bills.length : 0;

  const log = (id: string) => {
    const b = bills.find((x) => x.id === id);
    if (!b) return;
    const day = Math.min(b.dueDay, daysInMonth(month));
    openEntry("expense", undefined, {
      categoryId: b.categoryId,
      description: b.name,
      amount: b.amount ?? 0,
      method: b.method ?? (b.autopay ? "Autopay" : undefined),
      kind: "Fixed",
      billId: b.id,
      date: month === thisMonth() ? todayKey() : `${month}-${String(day).padStart(2, "0")}`,
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="Bills"
        title={
          <>
            The ones that always come back
          </>
        }
        right={<MonthSwitcher />}
      />
      <SampleBanner />
      <Stagger className="flex flex-col gap-5">
        <Rise className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <SpotlightCard as="div" className="p-5">
            <div className="eyebrow">Fixed bills / month</div>
            <Money value={total} decimals className="mt-2 block font-serif text-[34px] leading-none text-ivory" />
          </SpotlightCard>
          <SpotlightCard as="div" className="p-5">
            <div className="eyebrow">Logged in {monthLabel(month, "short")}</div>
            <div className="mt-2 flex items-center gap-3">
              <span className="tnum font-serif text-[34px] leading-none text-ivory">
                {paid}
                <span className="text-dim">/{bills.length}</span>
              </span>
              <svg viewBox="0 0 36 36" className="size-9 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="4" />
                <motion.circle cx="18" cy="18" r="15" fill="none" stroke="#7fd8a9" strokeWidth="4" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: progress }} transition={{ type: "spring", stiffness: 60, damping: 16 }} />
              </svg>
            </div>
          </SpotlightCard>
          <SpotlightCard as="div" className="col-span-2 p-5 sm:col-span-1">
            <div className="eyebrow">On autopay</div>
            <div className="mt-2 flex items-center gap-2 font-serif text-[34px] leading-none text-ivory">
              <span className="tnum">
                {auto}
                <span className="text-dim">/{bills.length}</span>
              </span>
              <Zap className="size-5 text-champagne" />
            </div>
          </SpotlightCard>
        </Rise>

        <Rise>
          <SpotlightCard className="p-4 sm:p-6">
            <CardHeader
              title="Recurring bills"
              hint="Log payment adds the bill to this month's expenses."
              action={
                <Button variant="primary" size="sm" onClick={() => openBill()}>
                  <Plus /> Add bill
                </Button>
              }
            />
            <div className="mt-4">
              {bills.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="font-serif text-[28px] text-ivory">List what repeats every month</div>
                  <p className="mx-auto mt-2 max-w-[44ch] text-[13px] text-dim">Rent, utilities, phone, insurance, subscriptions. Log each one when it&apos;s paid and it ticks off here.</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {rows.map(({ bill, day, state }, i) => {
                    const c = bill.categoryId ? catById.get(bill.categoryId) : undefined;
                    const color = c ? BUCKETS[c.bucket].color : OTHER_COLOR;
                    return (
                      <motion.div
                        key={bill.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30, delay: i * 0.03 }}
                        className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-t border-line py-4 first:border-t-0 sm:grid-cols-[52px_minmax(0,1fr)_auto_auto]"
                      >
                        <div className="relative grid size-[52px] place-items-center rounded-2xl border border-line bg-white/[0.03] leading-none">
                          <span className="tnum font-serif text-[24px] text-ivory">{day}</span>
                          <span className="absolute bottom-1 text-[9.5px] text-dim">{monthLabel(month, "short")}</span>
                          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full" style={{ background: color }} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 truncate text-[14.5px] font-medium text-ivory">
                            {bill.name}
                            {bill.autopay && <Zap className="size-3.5 shrink-0 text-champagne" />}
                          </div>
                          <div className="tnum truncate text-[12.5px] text-dim">
                            {[c?.name ?? "No category", bill.amount ? formatMoney(bill.amount, currency, true) : "Amount varies", bill.method].filter(Boolean).join(", ")}
                          </div>
                        </div>
                        <BillPill state={state} />
                        <div className="col-span-3 flex items-center gap-1.5 sm:col-span-1 sm:col-start-auto">
                          <span className="w-[52px] sm:hidden" />
                          {state.kind !== "paid" ? (
                            <Button size="sm" onClick={() => log(bill.id)}>
                              Log payment
                            </Button>
                          ) : (
                            <span className="tnum px-2 text-[12.5px] text-good">{formatMoney(state.entry.amount, currency, true)}</span>
                          )}
                          <Button variant="ghost" size="icon-sm" onClick={() => openBill(bill)} aria-label={`Edit ${bill.name}`}>
                            <Pencil />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
            <p className="mt-4 text-[12px] text-dim">Paid with a credit card? Log it here once and skip the card&apos;s monthly payment, so it isn&apos;t counted twice.</p>
          </SpotlightCard>
        </Rise>
      </Stagger>
    </>
  );
}
