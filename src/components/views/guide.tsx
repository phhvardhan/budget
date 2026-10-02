"use client";

import { Clock } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { SpotlightCard, CardHeader } from "@/components/ui/spotlight-card";
import { Stagger, Rise } from "@/components/ui/motion";
import { Kbd } from "@/components/ui/button";

const ROUTINE = [
  ["Every payday", "2 min", "Log the paycheck", "Gross pay and taxes & deductions. Take-home is worked out for you. Only know the deposit? Enter it as gross."],
  ["Every week", "10 min", "Log the week's spending", "Open your bank and card apps and add each transaction. ⌘K and “groceries 54” is the fastest way. Weekly keeps it painless."],
  ["Month end", "15 min", "Review the month", "Check budgets over their limit, your Needs / Wants / Savings split and your savings rate. Sweep anything left over into savings."],
  ["New month", "5 min", "Adjust the plan", "Tune category budgets with what you learned. Bills reset on their own and the month starts clean."],
];

const RULES = [
  ["Credit cards", "Log each card purchase on the day you buy it. Don't also log the card's monthly payment, or the same spending counts twice."],
  ["Savings & debt", "Transfers to savings or investments and extra debt payments are expenses in a Savings & Debt category. They count toward your savings rate, not your spending."],
  ["Payroll deductions", "Taxes, pre-tax retirement and payroll insurance belong in the paycheck's Taxes & deductions field, not in expenses."],
  ["Refunds", "Log a refund as a negative amount in the same category as the purchase."],
  ["Savings rate", "Saved & invested plus whatever is left over, divided by take-home pay. It's the one number to watch climb."],
  ["Emergency fund", "A common guideline is 3–6 months of Needs spending. The Year page works out that range from your own averages."],
  ["50 / 30 / 20", "A common starting split of take-home pay: about 50% Needs, 30% Wants, 20% Savings & Debt. Change the targets on Budget to fit your life."],
];

const QUICK = [
  ["54.20 groceries trader joes", "Expense · Groceries · today"],
  ["uber 18 yesterday", "Expense · Transportation · yesterday"],
  ["rent 1500 oct 1", "Expense · Housing · Oct 1"],
  ["+3250 salary", "Income · Salary · today"],
  ["netflix 15.49 10/3", "Expense · Subscriptions · Oct 3"],
];

const KEYS = [
  [["⌘", "K"], "Quick add (Ctrl + K on Windows)"],
  [["/"], "Quick add"],
  [["N"], "New expense"],
  [["I"], "Log a paycheck"],
  [["["], "Previous month"],
  [["]"], "Next month"],
  [["1", "–", "6"], "Jump between pages"],
] as const;

export function Guide() {
  return (
    <>
      <PageHeader
        eyebrow="How it works"
        title={
          <>
            Thirty minutes a month.
          </>
        }
        sub="Log every dollar in, log every dollar out, review once a month. That's the whole system."
      />
      <Stagger className="flex flex-col gap-5">
        <Rise className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ROUTINE.map(([when, time, title, body]) => (
            <SpotlightCard key={when} as="article" className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <span className="eyebrow">{when}</span>
                <span className="flex items-center gap-1 rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px] text-mist">
                  <Clock className="size-3" />
                  {time}
                </span>
              </div>
              <h3 className="font-serif text-[26px] leading-[1.05] text-ivory">{title}</h3>
              <p className="mt-3 text-[13px] leading-relaxed text-mist">{body}</p>
            </SpotlightCard>
          ))}
        </Rise>

        <Rise className="grid gap-4 lg:grid-cols-5">
          <SpotlightCard className="p-6 lg:col-span-3">
            <CardHeader title="Rules that keep the numbers right" hint="General guidelines, not personal financial advice." />
            <dl className="mt-4">
              {RULES.map(([k, v]) => (
                <div key={k} className="grid gap-1 border-t border-line py-4 first:border-t-0 sm:grid-cols-[170px_1fr] sm:gap-6">
                  <dt className="text-[13.5px] font-medium text-ivory">{k}</dt>
                  <dd className="text-[13px] leading-relaxed text-mist">{v}</dd>
                </div>
              ))}
            </dl>
          </SpotlightCard>
          <div className="flex flex-col gap-4 lg:col-span-2">
            <SpotlightCard className="p-6">
              <CardHeader title="Quick add speaks plain English" hint="The first number is the amount. Words pick the category. + means income." />
              <ul className="mt-4 flex flex-col gap-2">
                {QUICK.map(([q, r]) => (
                  <li key={q} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-white/[0.02] px-3 py-2.5">
                    <code className="font-mono text-[12.5px] text-champagne">{q}</code>
                    <span className="text-[11.5px] text-dim">{r}</span>
                  </li>
                ))}
              </ul>
            </SpotlightCard>
            <SpotlightCard className="p-6">
              <CardHeader title="Keyboard" />
              <ul className="mt-4 flex flex-col gap-2.5">
                {KEYS.map(([keys, label]) => (
                  <li key={label} className="flex items-center justify-between gap-3 text-[13px] text-mist">
                    {label}
                    <span className="flex gap-1">
                      {keys.map((k, i) => (
                        <Kbd key={i}>{k}</Kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </SpotlightCard>
          </div>
        </Rise>
      </Stagger>
    </>
  );
}
