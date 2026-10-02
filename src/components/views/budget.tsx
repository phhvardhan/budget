"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Download, Plus, Sparkles, Trash2, Upload } from "lucide-react";
import { useData, useUI } from "@/lib/store";
import { bucketBudgets, targetsOf } from "@/lib/calc";
import { BUCKETS, BUCKET_ORDER, CURRENCIES } from "@/lib/defaults";
import { formatMoney, formatPct } from "@/lib/format";
import { round2, uid, cn } from "@/lib/cn";
import { cloudEnabled } from "@/lib/supabase";
import type { Bucket, Category } from "@/lib/types";
import { PageHeader } from "@/components/shell/page-header";
import { SpotlightCard, CardHeader } from "@/components/ui/spotlight-card";
import { Money } from "@/components/ui/money";
import { Field, Input, Select } from "@/components/ui/fields";
import { Button } from "@/components/ui/button";
import { Status } from "@/components/ui/status";
import { Stagger, Rise } from "@/components/ui/motion";
import { SampleBanner } from "./sample-banner";
import { AccountCard } from "@/components/auth/account-card";

/** Text/number input that keeps its own draft while focused and commits on change. */
function useDraft(value: string | number, commit: (v: string) => void, delay = 400) {
  const [draft, setDraft] = useState(String(value));
  const focused = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!focused.current) setDraft(String(value));
  }, [value]);
  return {
    value: draft,
    onFocus: () => (focused.current = true),
    onBlur: () => {
      focused.current = false;
      if (timer.current) clearTimeout(timer.current);
      commit(draft);
    },
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setDraft(e.target.value);
      if (timer.current) clearTimeout(timer.current);
      const v = e.target.value;
      timer.current = setTimeout(() => commit(v), delay);
    },
  };
}

export function Budget() {
  const settings = useData((s) => s.settings)!;
  const categories = useData((s) => s.categories);
  const th = settings.takeHome;
  const bb = bucketBudgets(categories);
  const assigned = bb.needs + bb.wants + bb.savings;
  const left = th - assigned;
  const t = targetsOf(settings);
  const tsum = t.needs + t.wants + t.savings;
  const scale = Math.max(th, assigned) || 1;

  const thInput = useDraft(th, (v) => useData.getState().saveSettings({ takeHome: Math.max(0, round2(v)) }));

  return (
    <>
      <PageHeader
        eyebrow="Budget"
        title={
          <>
            Every dollar, a job
          </>
        }
        sub="Set what you take home, then split it across categories until nothing is left unassigned. Changes save as you type."
      />
      <SampleBanner />
      <Stagger className="grid grid-cols-12 gap-4 lg:gap-5">
        <Rise className="col-span-12 lg:col-span-5">
          <div className="flex flex-col gap-4 lg:sticky lg:top-8 lg:gap-5">
            <SpotlightCard className="p-6">
              <CardHeader title="Your pay" />
              <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
                <Field label="Monthly take-home" htmlFor="th">
                  <Input id="th" type="number" inputMode="decimal" min={0} step={50} className="tnum h-12 font-serif text-[22px]" {...thInput} />
                </Field>
                <Field label="Currency" htmlFor="cur">
                  <Select id="cur" value={settings.currency} onChange={(e) => useData.getState().saveSettings({ currency: e.target.value })} className="h-12 w-[150px]">
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="mt-7">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[13px] text-mist">
                    Assigned <Money value={assigned} className="text-ivory" /> of {formatMoney(th, settings.currency)}
                  </span>
                  {Math.abs(left) < 0.5 ? (
                    <Status tone="good">Every dollar has a job</Status>
                  ) : left > 0 ? (
                    <Status tone="warn">{formatMoney(left, settings.currency)} unassigned</Status>
                  ) : (
                    <Status tone="bad">{formatMoney(-left, settings.currency)} over pay</Status>
                  )}
                </div>
                <div className="flex h-3 gap-[3px] overflow-hidden rounded-full bg-white/[0.04]">
                  {BUCKET_ORDER.map((k) => (
                    <motion.div
                      key={k}
                      className="h-full rounded-full"
                      style={{ background: BUCKETS[k].color }}
                      animate={{ width: `${(bb[k] / scale) * 100}%` }}
                      initial={{ width: 0 }}
                      transition={{ type: "spring", stiffness: 120, damping: 22 }}
                    />
                  ))}
                  {left > 0 && <motion.div className="hatch h-full rounded-full" animate={{ width: `${(left / scale) * 100}%` }} initial={{ width: 0 }} />}
                </div>
              </div>

              <div className="mt-7">
                <div className="eyebrow mb-3">Target split</div>
                <div className="grid grid-cols-3 gap-2.5">
                  {BUCKET_ORDER.map((k) => (
                    <TargetInput key={k} bucket={k} value={t[k]} />
                  ))}
                </div>
                <p className={cn("mt-2.5 text-[12px]", Math.abs(tsum - 1) < 0.001 ? "text-dim" : "text-warn")}>
                  {Math.abs(tsum - 1) < 0.001 ? "Targets add up to 100%. 50/30/20 is a common starting point." : `Targets add up to ${Math.round(tsum * 100)}%. Adjust them to total 100%.`}
                </p>
              </div>

              <div className="mt-6 flex flex-col">
                {BUCKET_ORDER.map((k) => (
                  <div key={k} className="flex items-center justify-between gap-3 border-t border-line py-3 text-[13px]">
                    <span className="flex items-center gap-2 text-mist">
                      <i className="inline-block size-2 rounded-[3px]" style={{ background: BUCKETS[k].color }} />
                      {BUCKETS[k].label}
                    </span>
                    <span className="tnum text-dim">
                      <span className="text-ivory">{formatMoney(bb[k], settings.currency)}</span> · {th ? formatPct(bb[k] / th) : "—"} of pay vs {formatPct(t[k])}
                    </span>
                  </div>
                ))}
              </div>
            </SpotlightCard>
            {cloudEnabled && <AccountCard />}
            <DataCard />
          </div>
        </Rise>

        <Rise className="col-span-12 lg:col-span-7">
          <SpotlightCard className="p-6">
            <CardHeader title="Monthly budget by category" hint="Rename, re-budget, add or remove. Saves automatically." />
            <div className="mt-2">
              {BUCKET_ORDER.map((k) => (
                <BucketGroup key={k} bucket={k} categories={categories.filter((c) => c.bucket === k)} total={bb[k]} takeHome={th} currency={settings.currency} />
              ))}
            </div>
          </SpotlightCard>
        </Rise>
      </Stagger>
    </>
  );
}

function TargetInput({ bucket, value }: { bucket: Bucket; value: number }) {
  const settings = useData((s) => s.settings)!;
  const input = useDraft(Math.round(value * 100), (v) => {
    const targets = { ...targetsOf(settings), [bucket]: Math.max(0, Math.min(100, Number(v) || 0)) / 100 };
    useData.getState().saveSettings({ targets });
  });
  return (
    <Field label={BUCKETS[bucket].short} htmlFor={`t-${bucket}`}>
      <div className="relative">
        <Input id={`t-${bucket}`} type="number" min={0} max={100} step={5} className="tnum pr-8" {...input} />
        <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[13px] text-dim">%</span>
      </div>
    </Field>
  );
}

function BucketGroup({ bucket, categories, total, takeHome, currency }: { bucket: Bucket; categories: Category[]; total: number; takeHome: number; currency: string }) {
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <span className="flex items-center gap-2 text-[14px] font-medium text-ivory">
          <i className="inline-block h-[3px] w-4 rounded-full" style={{ background: BUCKETS[bucket].color }} />
          {BUCKETS[bucket].label}
        </span>
        <Money value={total} className="font-serif text-[20px] text-ivory" />
      </div>
      <AnimatePresence initial={false}>
        {categories.map((c) => (
          <CategoryRow key={c.id} c={c} takeHome={takeHome} currency={currency} />
        ))}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => {
          const all = useData.getState().categories;
          useData.getState().upsertCategory({ id: uid(), name: "New category", bucket, budget: 0, sort: all.length });
        }}
        className="mt-2 flex cursor-pointer items-center gap-1.5 rounded-lg px-1 py-1.5 text-[12.5px] text-dim transition hover:text-champagne"
      >
        <Plus className="size-3.5" /> Add {BUCKETS[bucket].short.toLowerCase()} category
      </button>
    </div>
  );
}

function CategoryRow({ c, takeHome, currency }: { c: Category; takeHome: number; currency: string }) {
  const [armed, setArmed] = useState(false);
  const name = useDraft(c.name, (v) => v.trim() && v !== c.name && useData.getState().upsertCategory({ ...c, name: v.trim() }));
  const budget = useDraft(c.budget, (v) => round2(v) !== c.budget && useData.getState().upsertCategory({ ...c, budget: Math.max(0, round2(v)) }));
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0, x: -20 }}
      transition={{ type: "spring", stiffness: 400, damping: 36 }}
      className="overflow-hidden"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_118px_52px_32px] items-center gap-2 border-b border-line py-1.5 sm:grid-cols-[minmax(0,1fr)_140px_60px_32px]">
        <input aria-label="Category name" className="h-10 min-w-0 rounded-lg border border-transparent bg-transparent px-2.5 text-[13.5px] text-ivory outline-none transition hover:border-line-2 focus:border-champagne/50 focus:bg-white/[0.04]" {...name} />
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[12px] text-dim">{formatMoney(0, currency).replace(/[\d.,\s]/g, "")}</span>
          <input
            aria-label={`Monthly budget for ${c.name}`}
            type="number"
            inputMode="decimal"
            min={0}
            step={10}
            className="tnum h-10 w-full rounded-lg border border-transparent bg-transparent pr-2.5 pl-6 text-right text-[13.5px] text-ivory outline-none transition hover:border-line-2 focus:border-champagne/50 focus:bg-white/[0.04]"
            {...budget}
          />
        </div>
        <span className="tnum text-right text-[11.5px] text-dim">{takeHome ? formatPct(c.budget / takeHome) : ""}</span>
        <button
          type="button"
          aria-label={armed ? `Confirm removing ${c.name}` : `Remove ${c.name}`}
          onClick={() => {
            if (!armed) return setArmed(true);
            useData.getState().deleteCategory(c.id);
            useUI.getState().toast(`Removed ${c.name}`);
          }}
          className={cn(
            "grid size-8 cursor-pointer place-items-center rounded-lg transition",
            armed ? "bg-bad/15 text-bad" : "text-dim opacity-60 hover:bg-white/[0.06] hover:text-ivory hover:opacity-100",
          )}
        >
          {armed ? <Check className="size-4" /> : <Trash2 className="size-4" />}
        </button>
      </div>
    </motion.div>
  );
}

function DataCard() {
  const hasSample = useData((s) => s.entries.some((e) => e.isSample));
  const fileRef = useRef<HTMLInputElement>(null);

  const exportJson = () => {
    const { settings, categories, entries, bills } = useData.getState();
    const blob = new Blob([JSON.stringify({ app: "payday-ledger", version: 1, exportedAt: new Date().toISOString(), settings, categories, entries, bills }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payday-ledger-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const importJson = async (file: File) => {
    try {
      const d = JSON.parse(await file.text());
      if (d.app !== "payday-ledger" || !Array.isArray(d.entries)) throw new Error("not a backup");
      useData.getState().importBackup({ settings: d.settings, categories: d.categories ?? [], entries: d.entries, bills: d.bills ?? [] });
      useUI.getState().toast(`Restored ${d.entries.length} entries`);
    } catch {
      useUI.getState().toast("That file isn't a Payday Ledger backup.", { tone: "error" });
    }
  };

  return (
    <SpotlightCard className="p-6">
      <CardHeader title="Your data" hint={cloudEnabled ? "Synced to your Supabase project and cached on this device." : "Stored in this browser. Add Supabase keys to sync devices."} />
      <div className="mt-5 flex flex-wrap gap-2">
        <Button size="sm" onClick={exportJson}>
          <Download /> Back up (JSON)
        </Button>
        <Button size="sm" onClick={() => fileRef.current?.click()}>
          <Upload /> Restore
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importJson(f);
            e.target.value = "";
          }}
        />
        {hasSample ? (
          <Button size="sm" variant="ghost" onClick={() => useData.getState().clearSample()}>
            Clear sample data
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              useData.getState().loadSample();
              useUI.getState().toast("Sample data added. Clear it any time.");
            }}
          >
            <Sparkles /> Load sample data
          </Button>
        )}
      </div>
    </SpotlightCard>
  );
}
