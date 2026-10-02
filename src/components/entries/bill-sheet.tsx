"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useData, useUI, type SheetState } from "@/lib/store";
import { BUCKETS, BUCKET_ORDER, METHODS } from "@/lib/defaults";
import { closeSheet } from "@/lib/hooks";
import { round2, uid } from "@/lib/cn";
import type { Bill } from "@/lib/types";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/fields";
import { Segmented } from "@/components/ui/segmented";

type BillSheetState = Extract<SheetState, { kind: "bill" }>;

export function BillSheet() {
  const sheet = useUI((s) => s.sheet);
  const open = useUI((s) => s.sheetOpen);
  if (sheet?.kind !== "bill") return null;
  return <BillSheetInner key={sheet.nonce} sheet={sheet} open={open} />;
}

function BillSheetInner({ sheet, open }: { sheet: BillSheetState; open: boolean }) {
  const categories = useData((s) => s.categories);
  const editing = !!sheet.bill;
  const [b, setB] = useState(() => {
    const x = sheet.bill;
    return {
      id: x?.id ?? uid(),
      name: x?.name ?? "",
      categoryId: x?.categoryId ?? "",
      amount: x?.amount != null ? String(x.amount) : "",
      dueDay: String(x?.dueDay ?? 1),
      autopay: x?.autopay ?? false,
      method: x?.method ?? "",
      isSample: !!x?.isSample,
    };
  });
  const [error, setError] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);

  const save = () => {
    if (!b.name.trim()) return setError("Name the bill.");
    const bill: Bill = {
      id: b.id,
      name: b.name.trim(),
      categoryId: b.categoryId || null,
      amount: b.amount === "" ? null : round2(b.amount),
      dueDay: Math.max(1, Math.min(31, parseInt(b.dueDay, 10) || 1)),
      autopay: b.autopay,
      method: b.method || undefined,
      isSample: b.isSample,
    };
    useData.getState().upsertBill(bill);
    closeSheet();
    useUI.getState().toast(editing ? "Bill saved" : "Bill added");
  };

  return (
    <Sheet
      open={open}
      onClose={closeSheet}
      title={editing ? "Edit bill" : "New recurring bill"}
      footer={
        <>
          {editing && (
            <Button
              variant={armed ? "danger" : "ghost"}
              onClick={() => {
                if (!armed) return setArmed(true);
                useData.getState().deleteBill(b.id);
                closeSheet();
                useUI.getState().toast("Bill deleted");
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
            {editing ? "Save" : "Add bill"}
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field label="Bill" htmlFor="b-name">
          <Input id="b-name" autoFocus placeholder="e.g. Rent" value={b.name} onChange={(e) => setB({ ...b, name: e.target.value })} />
        </Field>
        <Field label="Category" htmlFor="b-cat">
          <Select id="b-cat" value={b.categoryId} onChange={(e) => setB({ ...b, categoryId: e.target.value })}>
            <option value="">Choose a category</option>
            {BUCKET_ORDER.map((k) => (
              <optgroup key={k} label={BUCKETS[k].label}>
                {categories
                  .filter((c) => c.bucket === k)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Usual amount" htmlFor="b-amt" hint="Leave empty if it varies.">
            <Input id="b-amt" type="number" inputMode="decimal" step="0.01" placeholder="0.00" value={b.amount} onChange={(e) => setB({ ...b, amount: e.target.value })} />
          </Field>
          <Field label="Due day of month" htmlFor="b-due">
            <Input id="b-due" type="number" min={1} max={31} value={b.dueDay} onChange={(e) => setB({ ...b, dueDay: e.target.value })} />
          </Field>
        </div>
        <Field label="Paid with" htmlFor="b-method">
          <Select id="b-method" value={b.method} onChange={(e) => setB({ ...b, method: e.target.value })}>
            <option value="">—</option>
            {METHODS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </Field>
        <Field label="Autopay">
          <Segmented
            size="sm"
            value={b.autopay ? "on" : "off"}
            onChange={(v) => setB({ ...b, autopay: v === "on" })}
            options={[
              { value: "on", label: "On" },
              { value: "off", label: "Off" },
            ]}
          />
        </Field>
        {error && <p className="text-[13px] text-bad">{error}</p>}
        <button type="submit" className="hidden" />
      </form>
    </Sheet>
  );
}
