"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { daysInMonth, thisMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];

/** One square per day, glowing brighter the more was spent. Click a day to see its entries. */
export function SpendCalendar({ month, days, currency }: { month: string; days: number[]; currency: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);
  const [y, m] = month.split("-").map(Number);
  const offset = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  const n = daysInMonth(month);
  const today = month === thisMonth() ? new Date().getDate() : month < thisMonth() ? n + 1 : 0;
  const nonzero = days.filter((d) => d > 0).sort((a, b) => a - b);
  const q = (p: number) => nonzero[Math.min(nonzero.length - 1, Math.floor(p * nonzero.length))] ?? 0;
  const cuts = [q(0.25), q(0.5), q(0.75), q(0.92)];
  const level = (v: number) => (v <= 0 ? 0 : 1 + cuts.filter((c) => v > c).length);
  const alpha = [0, 0.14, 0.26, 0.42, 0.62, 0.85];
  const total = days.reduce((a, b) => a + b, 0);
  const elapsed = Math.max(1, Math.min(n, today === n + 1 ? n : today || n));
  const shown = hover != null ? hover : null;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-2 text-[12.5px]">
        <span className="text-mist">
          {shown != null ? (
            <>
              <span className="text-ivory">{new Date(y, m - 1, shown + 1).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
              {" · "}
              <span className="tnum text-ivory">{formatMoney(days[shown], currency, true)}</span>
            </>
          ) : (
            <>
              Avg <span className="tnum text-ivory">{formatMoney(total / elapsed, currency)}</span> a day
            </>
          )}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {WEEK.map((d, i) => (
          <span key={i} className="pb-1 text-center font-mono text-[10px] text-dim">
            {d}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={`o${i}`} />
        ))}
        {days.map((v, i) => {
          const lv = level(v);
          const future = i + 1 > today && today !== n + 1;
          const isToday = i + 1 === today;
          const day = `${month}-${String(i + 1).padStart(2, "0")}`;
          return (
            <motion.button
              key={i}
              type="button"
              disabled={future}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onClick={() => router.push(`/activity?day=${day}`)}
              aria-label={`${day}: ${formatMoney(v, currency, true)}`}
              initial={reduce ? false : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.012, type: "spring", stiffness: 300, damping: 24 }}
              whileHover={future ? undefined : { scale: 1.12 }}
              className={cn(
                "relative grid aspect-square cursor-pointer place-items-center rounded-[9px] font-mono text-[10px] transition-colors disabled:cursor-default",
                future ? "border border-dashed border-white/[0.06] text-dim/40" : "border border-white/[0.04] text-mist",
                isToday && "ring-1 ring-champagne/70",
              )}
              style={{
                background: future ? "transparent" : lv ? `rgb(230 211 174 / ${alpha[lv]})` : "rgb(255 255 255 / 0.025)",
                color: lv >= 4 ? "#1a1610" : undefined,
                boxShadow: lv >= 4 ? "0 0 16px -4px rgb(230 211 174 / 0.6)" : undefined,
              }}
            >
              {i + 1}
            </motion.button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 font-mono text-[10px] text-dim">
        less
        {alpha.slice(1).map((a) => (
          <i key={a} className="inline-block size-2.5 rounded-[3px]" style={{ background: `rgb(230 211 174 / ${a})` }} />
        ))}
        more
      </div>
    </div>
  );
}
