"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowRight,
  CalendarDays,
  CornerDownLeft,
  LayoutGrid,
  ListOrdered,
  PieChart,
  Receipt,
  Sparkles,
  BookOpen,
  Plus,
} from "lucide-react";
import { useData, useUI } from "@/lib/store";
import { parseQuick } from "@/lib/parse";
import { BUCKETS } from "@/lib/defaults";
import { formatMoney } from "@/lib/format";
import { dayLabel } from "@/lib/dates";
import { openEntry } from "@/lib/hooks";
import { uid, round2, cn } from "@/lib/cn";
import { Kbd } from "@/components/ui/button";

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: React.ElementType;
  run: () => void;
}

const EXAMPLES = ["54.20 groceries trader joes", "uber 18 yesterday", "+3250 salary", "rent 1500 oct 1", "netflix 15.49"];

/** ⌘K: type "uber 18" and press Enter. Natural-language quick entry plus jump-to navigation. */
export function QuickAdd() {
  const open = useUI((s) => s.quickAdd);
  return <AnimatePresence>{open && <QuickAddPanel key="quick-add" />}</AnimatePresence>;
}

function QuickAddPanel() {
  const categories = useData((s) => s.categories);
  const currency = useData((s) => s.settings?.currency ?? "USD");
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [example, setExample] = useState(0);

  const close = () => useUI.getState().set({ quickAdd: false });

  useEffect(() => {
    const f = setTimeout(() => inputRef.current?.focus(), 40);
    const t = setInterval(() => setExample((x) => (x + 1) % EXAMPLES.length), 2600);
    return () => {
      clearTimeout(f);
      clearInterval(t);
    };
  }, []);

  const parsed = useMemo(() => (q.trim() ? parseQuick(q, categories) : null), [q, categories]);
  const ready = parsed && parsed.amount != null && parsed.amount !== 0;
  const cat = parsed?.categoryId ? categories.find((c) => c.id === parsed.categoryId) : undefined;

  const commands: Command[] = useMemo(() => {
    const go = (href: string) => () => {
      router.push(href);
      close();
    };
    const all: Command[] = [
      { id: "exp", label: "New expense", hint: "Full form", icon: Plus, run: () => openEntry("expense") },
      { id: "inc", label: "Log a paycheck", hint: "Full form", icon: ArrowDownLeft, run: () => openEntry("income") },
      { id: "ov", label: "Go to Overview", icon: LayoutGrid, run: go("/") },
      { id: "ac", label: "Go to Activity", icon: ListOrdered, run: go("/activity") },
      { id: "bu", label: "Go to Budget", icon: PieChart, run: go("/budget") },
      { id: "bi", label: "Go to Bills", icon: Receipt, run: go("/bills") },
      { id: "yr", label: "Go to Year", icon: CalendarDays, run: go("/year") },
      { id: "gd", label: "How it works", icon: BookOpen, run: go("/guide") },
    ];
    const t = q.trim().toLowerCase();
    if (!t) return all;
    if (ready) return [];
    return all.filter((c) => c.label.toLowerCase().includes(t));
  }, [q, ready, router]);

  const commit = () => {
    if (!parsed || !ready) {
      commands[sel]?.run();
      return;
    }
    if (parsed.type === "income") {
      const id = uid();
      useData.getState().upsertEntry({ id, type: "income", date: parsed.date, gross: round2(parsed.amount), deductions: 0, source: parsed.source });
      useUI.getState().toast(`Logged ${formatMoney(parsed.amount!, currency, true)} income`, {
        action: { label: "Undo", run: () => useData.getState().deleteEntry(id) },
      });
    } else if (!parsed.categoryId) {
      openEntry("expense", undefined, { amount: round2(parsed.amount), description: parsed.description, date: parsed.date });
      return;
    } else {
      const id = uid();
      useData.getState().upsertEntry({
        id,
        type: "expense",
        date: parsed.date,
        amount: round2(parsed.amount),
        categoryId: parsed.categoryId,
        description: parsed.description || cat?.name || "",
        kind: "Variable",
      });
      useUI.getState().toast(`${formatMoney(parsed.amount!, currency, true)} · ${cat?.name}`, {
        action: { label: "Undo", run: () => useData.getState().deleteEntry(id) },
      });
    }
    const m = parsed.date.slice(0, 7);
    useUI.getState().set({ month: m });
    close();
  };

  return (
    <>
      {(
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-start sm:pt-[14vh]">
          <motion.div className="absolute inset-0 bg-black/55 backdrop-blur-[4px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Quick add"
            initial={{ opacity: 0, y: 24, scale: 0.97, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 16, scale: 0.98, filter: "blur(8px)" }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="glass-strong relative w-full max-w-[620px] overflow-hidden rounded-[26px] pb-[env(safe-area-inset-bottom)]"
          >
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[80%] -translate-x-1/2 rounded-full bg-champagne/10 blur-3xl" />
            <div className="relative flex items-center gap-3 border-b border-line px-5 py-4">
              <Sparkles className="size-5 shrink-0 text-champagne" />
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setSel(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") close();
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commit();
                    }
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setSel((s) => Math.min(s + 1, Math.max(commands.length - 1, 0)));
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setSel((s) => Math.max(s - 1, 0));
                    }
                    if (e.key === "Tab" && parsed?.amount != null) {
                      e.preventDefault();
                      if (parsed.type === "income") openEntry("income", undefined, { gross: round2(parsed.amount), date: parsed.date, source: parsed.source });
                      else openEntry("expense", undefined, { amount: round2(parsed.amount), categoryId: parsed.categoryId, description: parsed.description, date: parsed.date });
                    }
                  }}
                  placeholder=" "
                  className="peer w-full bg-transparent text-[18px] text-ivory outline-none focus-visible:outline-none"
                  aria-label="Type an amount and what it was for"
                />
                {!q && (
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center overflow-hidden text-[18px] text-dim">
                    <span className="mr-1.5">Try</span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={example}
                        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                        transition={{ duration: 0.3 }}
                        className="font-mono text-[15px] text-mist"
                      >
                        {EXAMPLES[example]}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                )}
              </div>
              <Kbd>esc</Kbd>
            </div>

            <AnimatePresence initial={false} mode="popLayout">
              {parsed && parsed.amount != null ? (
                <motion.div
                  key="preview"
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-5 py-5"
                >
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="min-w-0">
                      <div className="eyebrow mb-2">{parsed.type === "income" ? "Income" : "Expense"}</div>
                      <div className={cn("tnum font-serif text-[46px] leading-none", parsed.type === "income" ? "text-good" : "text-ivory")}>
                        {parsed.type === "income" ? "+" : ""}
                        {formatMoney(parsed.amount, currency, true)}
                      </div>
                      <div className="mt-2 truncate text-[13.5px] text-mist">{parsed.description || (parsed.type === "income" ? parsed.source : "No description")}</div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {parsed.type === "expense" && (
                        <Chip color={cat ? BUCKETS[cat.bucket].color : undefined}>{cat ? cat.name : "Pick a category on Enter"}</Chip>
                      )}
                      {parsed.type === "income" && <Chip color="#8fcfaa">{parsed.source}</Chip>}
                      <Chip>{dayLabel(parsed.date)}</Chip>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.ul key="commands" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-h-[46vh] overflow-y-auto p-2">
                  {commands.map((c, i) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onMouseEnter={() => setSel(i)}
                        onClick={() => c.run()}
                        className={cn(
                          "relative flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] transition-colors",
                          sel === i ? "text-ivory" : "text-mist",
                        )}
                      >
                        {sel === i && (
                          <motion.span layoutId="cmd-sel" className="absolute inset-0 rounded-xl bg-white/[0.06]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />
                        )}
                        <c.icon className="relative size-4 text-dim" />
                        <span className="relative flex-1">{c.label}</span>
                        {c.hint && <span className="relative text-[12px] text-dim">{c.hint}</span>}
                        {sel === i && <ArrowRight className="relative size-3.5 text-dim" />}
                      </button>
                    </li>
                  ))}
                  {commands.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-dim">Add an amount, like “lunch 14”.</li>}
                </motion.ul>
              )}
            </AnimatePresence>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-5 py-3 text-[11.5px] text-dim">
              <span className="flex items-center gap-1.5">
                <Kbd>
                  <CornerDownLeft className="size-3" />
                </Kbd>
                {ready ? "save" : "open"}
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>tab</Kbd> edit details
              </span>
              <span className="hidden items-center gap-1.5 sm:flex">
                <Kbd>+</Kbd> at the start for income
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

function Chip({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex h-7 items-center gap-1.5 rounded-full border border-line-2 px-2.5 text-[12px] text-ivory"
      style={color ? { background: `color-mix(in oklab, ${color} 18%, transparent)`, borderColor: `color-mix(in oklab, ${color} 50%, transparent)` } : undefined}
    >
      {color && <i className="inline-block size-1.5 rounded-full" style={{ background: color }} />}
      {children}
    </span>
  );
}
