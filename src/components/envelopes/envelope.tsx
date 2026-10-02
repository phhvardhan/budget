"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Bucket } from "@/lib/types";
import { BUCKETS } from "@/lib/defaults";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

export type EnvelopeData = {
  id: string;
  name: string;
  bucket: Bucket;
  budget: number;
  spent: number;
};

/** What an envelope says about itself, from its budget and what has gone in or out of it. */
export function readEnvelope(e: EnvelopeData, currency: string) {
  const saving = e.bucket === "savings";
  if (saving) {
    const fill = e.budget > 0 ? Math.min(1, e.spent / e.budget) : e.spent > 0 ? 1 : 0;
    return {
      fill,
      over: false,
      amount: formatMoney(e.spent, currency),
      caption: e.budget > 0 ? `in, of ${formatMoney(e.budget, currency)}` : "put in",
      stamp: e.budget > 0 && e.spent >= e.budget ? "Funded" : null,
      label: `${e.name}: ${formatMoney(e.spent, currency)} put in${e.budget > 0 ? ` of ${formatMoney(e.budget, currency)}` : ""}`,
    };
  }
  const left = e.budget - e.spent;
  const over = left < -0.005;
  const fill = e.budget > 0 ? Math.max(0, left / e.budget) : 0;
  return {
    fill,
    over,
    amount: over ? formatMoney(-left, currency) : formatMoney(Math.max(0, left), currency),
    caption: over ? "over budget" : e.budget > 0 ? `left of ${formatMoney(e.budget, currency)}` : "spent, no budget",
    stamp: over ? "Over" : e.budget > 0 && left <= 0.005 ? "Empty" : null,
    label: over
      ? `${e.name}: over budget by ${formatMoney(-left, currency)}`
      : `${e.name}: ${formatMoney(Math.max(0, left), currency)} left of ${formatMoney(e.budget, currency)}`,
  };
}

/** Geometry, in the SVG's own 200 × 140 units. */
const POCKET_TOP = 58;
const NOTE_FULL_Y = 6; // note tops sit here when the envelope is full
const NOTE_EMPTY_Y = 66; // and here, hidden behind the pocket, when it is empty

/**
 * A cash envelope. The notes standing up out of it are what's left to spend
 * (or, for savings, what has been put in). They drop in once when the page opens,
 * then rise and sink as entries are logged.
 */
export function Envelope({
  data,
  currency,
  index = 0,
  selected = false,
  onSelect,
}: {
  data: EnvelopeData;
  currency: string;
  index?: number;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const reduce = useReducedMotion();
  const clip = `env-${useId().replace(/:/g, "")}`;
  const tone = BUCKETS[data.bucket].color;
  const r = readEnvelope(data, currency);
  const top = NOTE_EMPTY_Y - (NOTE_EMPTY_Y - NOTE_FULL_Y) * r.fill;
  const notes = r.fill > 0.66 ? 3 : r.fill > 0.25 ? 2 : r.fill > 0 ? 1 : 0;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={r.label}
      whileHover={reduce ? undefined : { y: -3 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className="group/env relative block w-full cursor-pointer text-left [container-type:inline-size] focus-visible:outline-offset-4"
      style={{ ["--tone" as string]: tone }}
    >
      <svg viewBox="0 0 200 140" className="block w-full overflow-visible" aria-hidden>
        <defs>
          <clipPath id={clip}>
            <rect x="0" y="-200" width="200" height="334" />
          </clipPath>
        </defs>
        {/* open flap, folded up behind the money */}
        <path d="M10 36 92 6.5a24 24 0 0 1 16 0L190 36z" fill={`color-mix(in oklab, ${tone} 15%, #100e13)`} />
        <path d="M10 36 92 6.5a24 24 0 0 1 16 0L190 36" fill="none" stroke="#fff" strokeOpacity="0.06" />
        {/* back of the envelope */}
        <rect x="4" y="30" width="192" height="106" rx="9" fill={`color-mix(in oklab, ${tone} 20%, #121016)`} />
        <rect x="4.5" y="30.5" width="191" height="105" rx="8.5" fill="none" stroke="#fff" strokeOpacity="0.05" />

        {/* the money */}
        <g clipPath={`url(#${clip})`}>
        <motion.g
          initial={reduce ? false : { y: -70, opacity: 0 }}
          animate={{ y: top, opacity: 1 }}
          transition={{
            y: { type: "spring", stiffness: 110, damping: 17, delay: reduce ? 0 : 0.25 + index * 0.045 },
            opacity: { duration: 0.25, delay: reduce ? 0 : 0.25 + index * 0.045 },
          }}
        >
          {Array.from({ length: notes }, (_, i) => {
            const k = notes - 1 - i; // back to front
            return (
              <g key={i} transform={`translate(${22 + k * 5} ${k * 6}) rotate(${(k - 1) * 2.4} 78 40)`}>
                <rect width="156" height="80" rx="4" fill={`color-mix(in oklab, ${tone} 34%, #ece5d6)`} />
                <rect x="6" y="6" width="144" height="68" rx="2.5" fill="none" stroke={`color-mix(in oklab, ${tone} 70%, #2a2530)`} strokeOpacity="0.45" strokeWidth="1.2" />
                <circle cx="124" cy="30" r="13" fill="none" stroke={`color-mix(in oklab, ${tone} 70%, #2a2530)`} strokeOpacity="0.5" strokeWidth="1.6" />
                <path d="M18 22h56M18 30h40" stroke={`color-mix(in oklab, ${tone} 70%, #2a2530)`} strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
              </g>
            );
          })}
        </motion.g>
        </g>

        {/* front pocket, with a thumb notch */}
        <path
          d={`M4 ${POCKET_TOP}h76c6 0 9 13 20 13s14-13 20-13h76v69a9 9 0 0 1-9 9H13a9 9 0 0 1-9-9z`}
          fill={`color-mix(in oklab, ${tone} 27%, #1d1a22)`}
        />
        <path
          d={`M4 ${POCKET_TOP}h76c6 0 9 13 20 13s14-13 20-13h76`}
          fill="none"
          stroke="#fff"
          strokeOpacity="0.1"
        />
        <path d="M6 133 100 98l94 35" fill="none" stroke="#000" strokeOpacity="0.22" strokeWidth="1.2" />
        <path d="M6 134.5 100 99.5l94 35" fill="none" stroke="#fff" strokeOpacity="0.05" strokeWidth="1" />
      </svg>

      {/* writing on the pocket */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-[52%] flex-col justify-end px-[7%] pb-[6%]">
        <div className="truncate text-[12.5px] leading-tight font-medium text-ivory/90 [font-stretch:90%]">{data.name}</div>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className={cn("font-serif text-[clamp(18px,15cqi,26px)] leading-none", r.over ? "text-bad" : "text-ivory")}>{r.amount}</span>
          <span className="truncate text-[11px] text-ivory/50 @max-[150px]:hidden">{r.caption}</span>
        </div>
      </div>

      {r.stamp && (
        <span
          className={cn(
            "pointer-events-none absolute top-[24%] right-[7%] rotate-[-8deg] bg-[#16141a]/70 backdrop-blur-[1px] rounded-[4px] border-[1.5px] px-1.5 py-px text-[10.5px] font-bold tracking-[0.02em] [font-stretch:80%]",
            r.stamp === "Over" ? "border-bad/70 text-bad" : r.stamp === "Funded" ? "border-savings text-[#e2b65a]" : "border-ivory/30 text-ivory/50",
          )}
        >
          {r.stamp}
        </span>
      )}

      {selected && (
        <motion.span
          layoutId="envelope-selected"
          className="pointer-events-none absolute -inset-x-1 -bottom-2.5 mx-auto h-[3px] w-[40%] rounded-full"
          style={{ background: tone }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}
    </motion.button>
  );
}
