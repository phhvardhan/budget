"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { useData, useUI } from "@/lib/store";
import { BUCKETS, BUCKET_ORDER, CURRENCIES } from "@/lib/defaults";
import { formatMoney } from "@/lib/format";
import { round2 } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/fields";
import { LogoMark, Wordmark } from "@/components/shell/logo";

/** First run: one number in, a whole 50/30/20 budget out. */
export function Welcome() {
  const [pay, setPay] = useState("");
  const [currency, setCurrency] = useState("USD");
  const amount = round2(pay);
  const split = useMemo(() => ({ needs: amount * 0.5, wants: amount * 0.3, savings: amount * 0.2 }), [amount]);

  const create = (sample = false) => {
    const th = sample && !amount ? 5000 : amount;
    if (!th) {
      useUI.getState().toast("Enter your monthly take-home pay first.", { tone: "error" });
      return;
    }
    useData.getState().createBudget(th, currency);
    if (sample) useData.getState().loadSample();
    useUI.getState().toast(sample ? "Sample data loaded. Clear it any time from Budget." : "Budget created. Tune it on the Budget page.");
  };

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[560px]"
      >
        <div className="mb-10 flex items-center gap-3">
          <LogoMark className="size-10" />
          <Wordmark />
        </div>
        <div className="eyebrow mb-4">Takes about a minute</div>
        <h1 className="font-serif text-[48px] leading-[0.98] tracking-[-0.02em] text-ivory sm:text-[60px]">
          Give every dollar
          <br />
          of your paycheck a job.
        </h1>
        <p className="mt-4 max-w-[48ch] text-[14.5px] text-mist">
          Tell the ledger what lands in your account each month. It builds a starting budget on the 50/30/20 split that you can reshape any time.
        </p>

        <form
          className="glass mt-8 rounded-[24px] p-5 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();
            create(false);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_190px]">
            <Field label="Monthly take-home pay" htmlFor="w-pay" hint="After taxes and payroll deductions. Use a typical month if it varies.">
              <Input id="w-pay" autoFocus inputMode="decimal" type="number" min={0} step={50} placeholder="5000" value={pay} onChange={(e) => setPay(e.target.value)} className="tnum h-12 text-[18px]" />
            </Field>
            <Field label="Currency" htmlFor="w-cur">
              <Select id="w-cur" value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-12">
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-6">
            <div className="flex h-2.5 gap-[3px] overflow-hidden rounded-full">
              {BUCKET_ORDER.map((b, i) => (
                <motion.span
                  key={b}
                  className="h-full rounded-full"
                  style={{ background: BUCKETS[b].color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${[50, 30, 20][i]}%` }}
                  transition={{ type: "spring", stiffness: 90, damping: 18, delay: 0.4 + i * 0.12 }}
                />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {BUCKET_ORDER.map((b) => (
                <div key={b} className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[12px] text-mist">
                    <i className="inline-block size-1.5 rounded-full" style={{ background: BUCKETS[b].color }} />
                    {BUCKETS[b].label}
                  </div>
                  <div className="tnum truncate font-serif text-[24px] leading-tight text-ivory">{amount ? formatMoney(split[b], currency) : "—"}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button type="submit" variant="primary" size="lg">
              Create my budget <ArrowRight />
            </Button>
            <Button variant="ghost" size="lg" onClick={() => create(true)}>
              <Sparkles /> Explore with sample data
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
