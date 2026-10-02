"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Trash2 } from "lucide-react";
import { useData, useUI, type SheetState } from "@/lib/store";
import { BUCKETS, BUCKET_ORDER, METHODS, SOURCES } from "@/lib/defaults";
import { currencySymbol, formatMoney } from "@/lib/format";
import { defaultDateIn } from "@/lib/dates";
import { closeSheet, deleteEntryWithUndo } from "@/lib/hooks";
import { round2, uid, cn } from "@/lib/cn";
import type { Entry, EntryPreset } from "@/lib/types";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/fields";
import { Segmented } from "@/components/ui/segmented";

interface Draft {
  id: string;
  type: "expense" | "income";
  date: string;
  amount: string;
  categoryId: string | null;
  description: string;
  method: string;
  kind: "Fixed" | "Variable";
  billId: string | null;
  gross: string;
  deductions: string;
  source: string;
  note: string;
  isSample?: boolean;
  createdAt?: string;
}

function toDraft(type: "expense" | "income", month: string, e?: Entry, preset?: EntryPreset): Draft {
  const src = { ...(preset ?? {}), ...(e ?? {}) } as EntryPreset;
  return {
    id: e?.id ?? uid(),
    type,
    date: src.date ?? defaultDateIn(month),
    amount: src.amount != null && src.amount !== 0 ? String(src.amount) : "",
    categoryId: src.categoryId ?? null,
    description: src.description ?? "",
    method: src.method ?? "",
    kind: src.kind ?? "Variable",
    billId: src.billId ?? null,
    gross: src.gross ? String(src.gross) : "",
    deductions: src.deductions ? String(src.deductions) : "",
    source: src.source ?? "Salary",
    note: src.note ?? "",
    isSample: e?.isSample,
    createdAt: e?.createdAt,
  };
}

type EntrySheetState = Extract<SheetState, { kind: "entry" }>;

export function EntrySheet() {
  const sheet = useUI((s) => s.sheet);
  const open = useUI((s) => s.sheetOpen);
  if (sheet?.kind !== "entry") return null;
  return <EntrySheetInner key={sheet.nonce} sheet={sheet} open={open} />;
}

function EntrySheetInner({ sheet, open }: { sheet: EntrySheetState; open: boolean }) {
  const month = useUI((s) => s.month);
  const editing = !!sheet.entry;
  const [d, setD] = useState<Draft>(() => toDraft(sheet.type, useUI.getState().month, sheet.entry, sheet.preset));
  const [error, setError] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);

  const title = editing ? (d?.type === "income" ? "Edit income" : "Edit expense") : d?.type === "income" ? "Log a paycheck" : "New expense";

  const save = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return setError("Pick a date.");
    let entry: Entry;
    if (d.type === "expense") {
      const amount = round2(d.amount);
      if (!d.amount || !amount) return setError("Enter the amount.");
      if (!d.categoryId) return setError("Pick a category so it lands in the right bucket.");
      entry = {
        id: d.id,
        type: "expense",
        date: d.date,
        amount,
        categoryId: d.categoryId,
        description: d.description.trim(),
        method: d.method || undefined,
        kind: d.kind,
        billId: d.billId,
        isSample: d.isSample,
        createdAt: d.createdAt,
      };
    } else {
      const gross = round2(d.gross);
      if (!gross) return setError("Enter gross pay, or the deposit amount.");
      entry = {
        id: d.id,
        type: "income",
        date: d.date,
        gross,
        deductions: round2(d.deductions),
        source: d.source,
        note: d.note.trim() || undefined,
        isSample: d.isSample,
        createdAt: d.createdAt,
      };
    }
    useData.getState().upsertEntry(entry);
    const m = entry.date.slice(0, 7);
    if (m !== month) useUI.getState().set({ month: m });
    closeSheet();
    useUI.getState().toast(editing ? "Saved" : entry.type === "income" ? "Paycheck logged" : "Expense added", editing ? undefined : {
      action: { label: "Undo", run: () => useData.getState().deleteEntry(entry.id) },
    });
  };

  return (
    <Sheet
      open={open}
      onClose={closeSheet}
      title={title}
      footer={
        <>
          {editing && (
            <Button
              variant={armed ? "danger" : "ghost"}
              onClick={() => {
                if (!armed) return setArmed(true);
                if (sheet.entry) deleteEntryWithUndo(sheet.entry);
                closeSheet();
              }}
            >
              <Trash2 />
              {armed ? "Tap again to delete" : "Delete"}
            </Button>
          )}
          <span className="flex-1" />
          <Button variant="ghost" onClick={closeSheet}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            {editing ? "Save" : "Add"}
          </Button>
        </>
      }
    >
      {(
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          {!editing && (
            <Segmented
              label="Entry type"
              className="w-full"
              value={d.type}
              onChange={(type) => setD({ ...d, type })}
              options={[
                { value: "expense", label: "Expense" },
                { value: "income", label: "Income" },
              ]}
            />
          )}
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={d.type}
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-5"
            >
              {d.type === "expense" ? <ExpenseFields d={d} setD={setD} /> : <IncomeFields d={d} setD={setD} />}
            </motion.div>
          </AnimatePresence>
          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-[13px] text-bad">
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          <button type="submit" className="hidden" />
        </form>
      )}
    </Sheet>
  );
}

function BigAmount({ id, value, onChange, autoFocus }: { id: string; value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  const currency = useData((s) => s.settings?.currency ?? "USD");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) setTimeout(() => ref.current?.focus(), 260);
  }, [autoFocus]);
  return (
    <div className="flex items-baseline gap-2 rounded-2xl border border-line-2 bg-white/[0.03] px-4 py-3 transition focus-within:border-champagne/60 focus-within:shadow-[0_0_0_4px_rgb(230_211_174/0.08)]">
      <span className="font-serif text-[30px] leading-none text-dim">{currencySymbol(currency)}</span>
      <input
        ref={ref}
        id={id}
        inputMode="decimal"
        type="number"
        step="0.01"
        placeholder="0.00"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="tnum w-full min-w-0 bg-transparent font-serif text-[44px] leading-none text-ivory outline-none placeholder:text-white/15"
      />
    </div>
  );
}

function ExpenseFields({ d, setD }: { d: Draft; setD: (d: Draft) => void }) {
  const categories = useData((s) => s.categories);
  const grouped = useMemo(() => BUCKET_ORDER.map((b) => [b, categories.filter((c) => c.bucket === b)] as const), [categories]);
  return (
    <>
      <Field label="Amount" htmlFor="e-amount" hint="Got a refund? Enter a negative amount.">
        <BigAmount id="e-amount" value={d.amount} onChange={(amount) => setD({ ...d, amount })} autoFocus={!d.amount} />
      </Field>
      <div className="flex flex-col gap-3">
        <span className="text-[12px] font-medium text-mist">Category</span>
        {grouped.map(([b, cats]) => (
          <div key={b} className="flex flex-col gap-2">
            <span className="eyebrow flex items-center gap-2">
              <i className="inline-block size-1.5 rounded-full" style={{ background: BUCKETS[b].color }} />
              {BUCKETS[b].label}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {cats.map((c) => {
                const on = d.categoryId === c.id;
                return (
                  <motion.button
                    key={c.id}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setD({ ...d, categoryId: c.id })}
                    className={cn(
                      "relative cursor-pointer rounded-full border px-3 py-1.5 text-[12.5px] transition-colors",
                      on ? "border-transparent text-ivory" : "border-line-2 text-mist hover:border-white/20 hover:text-ivory",
                    )}
                    style={on ? { background: `color-mix(in oklab, ${BUCKETS[b].color} 30%, transparent)`, boxShadow: `inset 0 0 0 1px ${BUCKETS[b].color}` } : undefined}
                  >
                    {c.name}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <Field label="Description" htmlFor="e-desc">
        <Input id="e-desc" placeholder="e.g. Trader Joe's" value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" htmlFor="e-date">
          <Input id="e-date" type="date" value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} />
        </Field>
        <Field label="Paid with" htmlFor="e-method">
          <Select id="e-method" value={d.method} onChange={(e) => setD({ ...d, method: e.target.value })}>
            <option value="">—</option>
            {METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Type">
        <Segmented
          size="sm"
          value={d.kind}
          onChange={(kind) => setD({ ...d, kind })}
          options={[
            { value: "Variable", label: "Variable" },
            { value: "Fixed", label: "Fixed" },
          ]}
        />
      </Field>
    </>
  );
}

function IncomeFields({ d, setD }: { d: Draft; setD: (d: Draft) => void }) {
  const currency = useData((s) => s.settings?.currency ?? "USD");
  const net = (Number(d.gross) || 0) - (Number(d.deductions) || 0);
  return (
    <>
      <Field label="Gross pay" htmlFor="i-gross" hint="Only know the deposit amount? Put it here and leave deductions empty.">
        <BigAmount id="i-gross" value={d.gross} onChange={(gross) => setD({ ...d, gross })} autoFocus={!d.gross} />
      </Field>
      <Field label="Taxes & deductions" htmlFor="i-ded">
        <Input id="i-ded" inputMode="decimal" type="number" step="0.01" placeholder="0.00" value={d.deductions} onChange={(e) => setD({ ...d, deductions: e.target.value })} />
      </Field>
      <div className="flex items-center justify-between rounded-2xl border border-good/20 bg-good/[0.06] px-4 py-3">
        <span className="text-[13px] text-mist">Take-home</span>
        <motion.span key={net} initial={{ opacity: 0.4, y: -3 }} animate={{ opacity: 1, y: 0 }} className="tnum font-serif text-[26px] leading-none text-good">
          {formatMoney(net, currency, true)}
        </motion.span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" htmlFor="i-date">
          <Input id="i-date" type="date" value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} />
        </Field>
        <Field label="Source" htmlFor="i-source">
          <Select id="i-source" value={d.source} onChange={(e) => setD({ ...d, source: e.target.value })}>
            {SOURCES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Note" htmlFor="i-note">
        <Input id="i-note" placeholder="Optional" value={d.note} onChange={(e) => setD({ ...d, note: e.target.value })} />
      </Field>
    </>
  );
}
