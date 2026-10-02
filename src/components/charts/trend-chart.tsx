"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { MonthSummary } from "@/lib/types";
import { BUCKETS, OTHER_COLOR } from "@/lib/defaults";
import { formatCompact, formatMoney, formatPct } from "@/lib/format";
import { monthLabel } from "@/lib/dates";
import { useWidth } from "./use-width";

function niceMax(v: number) {
  if (v <= 0) return 1000;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

function smooth(points: [number, number][]) {
  if (points.length < 2) return "";
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const t = 0.18;
    d += `C${p1[0] + (p2[0] - p0[0]) * t},${p1[1] + (p2[1] - p0[1]) * t} ${p2[0] - (p3[0] - p1[0]) * t},${p2[1] - (p3[1] - p1[1]) * t} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** Twelve months of stacked spending with take-home pay traced as a line. Click a month to jump to it. */
export function TrendChart({
  data,
  selected,
  currency,
  onSelect,
}: {
  data: MonthSummary[];
  selected: string;
  currency: string;
  onSelect: (month: string) => void;
}) {
  const [ref, width] = useWidth<HTMLDivElement>(700);
  const [hover, setHover] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const H = width < 500 ? 220 : 260;
  const padL = 46, padR = 6, padT = 12, padB = 28;
  const iw = Math.max(width - padL - padR, 100), ih = H - padT - padB;
  const step = iw / data.length;
  const bw = Math.min(26, step * 0.52);

  const maxV = useMemo(() => niceMax(Math.max(1, ...data.map((d) => Math.max(d.net, d.outflow)))), [data]);
  const y = (v: number) => padT + ih - (v / maxV) * ih;
  const cx = (i: number) => padL + step * i + step / 2;
  const linePts = data.map((d, i) => [cx(i), y(d.net)] as [number, number]).filter((_, i) => data[i].net > 0);
  const firstWithIncome = data.findIndex((d) => d.net > 0);

  return (
    <div ref={ref} className="relative w-full">
      <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} className="block overflow-visible">
        <defs>
          <linearGradient id="net-line" gradientUnits="userSpaceOnUse" x1={padL} x2={width - padR} y1={0} y2={0}>
            <stop offset="0" stopColor="#e6d3ae" stopOpacity="0.4" />
            <stop offset="1" stopColor="#f8ecd4" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={padL} x2={width - padR} y1={y(maxV * f)} y2={y(maxV * f)} stroke="rgb(255 255 255 / 0.06)" strokeDasharray={f === 0 ? undefined : "2 4"} />
            <text x={padL - 10} y={y(maxV * f) + 3.5} textAnchor="end" fontSize={10.5} fill="#6f6a78" style={{ fontVariantNumeric: "tabular-nums" }}>
              {formatCompact(maxV * f, currency)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const segs = (
            [
              ["needs", d.buckets.needs, BUCKETS.needs.color],
              ["wants", d.buckets.wants, BUCKETS.wants.color],
              ["savings", d.buckets.savings, BUCKETS.savings.color],
              ["other", d.buckets.other, OTHER_COLOR],
            ] as const
          ).filter((s) => s[1] > 0);
          let acc = 0;
          const isSel = d.month === selected;
          const dim = hover != null ? hover !== i : !isSel;
          return (
            <motion.g
              key={d.month}
              initial={reduce ? false : { scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: dim ? 0.45 : 1 }}
              style={{ originY: 1 }}
              transition={{ scaleY: { type: "spring", stiffness: 120, damping: 18, delay: 0.05 * i }, opacity: { duration: 0.25 } }}
            >
              {segs.map(([k, v, color], j) => {
                const top = y(acc + v);
                const h = Math.max(y(acc) - top - (j > 0 ? 2 : 0), 1);
                acc += v;
                const last = j === segs.length - 1;
                const x = cx(i) - bw / 2;
                const r = last ? Math.min(5, h, bw / 2) : 0;
                const dPath = `M${x},${top + h}V${top + r}Q${x},${top} ${x + r},${top}H${x + bw - r}Q${x + bw},${top} ${x + bw},${top + r}V${top + h}Z`;
                return <path key={k} d={dPath} fill={color} />;
              })}
            </motion.g>
          );
        })}

        {linePts.length > 1 && (
          <motion.path
            d={smooth(linePts)}
            fill="none"
            stroke="url(#net-line)"
            strokeWidth={2}
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          />
        )}
        {data.map((d, i) =>
          d.net > 0 ? (
            <motion.circle
              key={`dot-${d.month}`}
              cx={cx(i)}
              cy={y(d.net)}
              r={hover === i || d.month === selected ? 4.5 : 3}
              fill="#0a090d"
              stroke="#f3e6cc"
              strokeWidth={2}
              initial={reduce ? false : { opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + Math.max(0, i - firstWithIncome) * 0.08, type: "spring", stiffness: 300, damping: 20 }}
            />
          ) : null,
        )}

        {data.map((d, i) => {
          const isSel = d.month === selected;
          const show = step >= 34 || i % 2 === 1 || isSel;
          return show ? (
            <text key={`l-${d.month}`} x={cx(i)} y={H - 8} textAnchor="middle" fontSize={11} fill={isSel ? "#f3efe7" : "#6f6a78"} fontWeight={isSel ? 600 : 400}>
              {monthLabel(d.month, "short")}
            </text>
          ) : null;
        })}

        {data.map((d, i) => (
          <rect
            key={`hit-${d.month}`}
            x={padL + step * i}
            y={padT}
            width={step}
            height={ih}
            fill="transparent"
            className="cursor-pointer"
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
            onClick={() => onSelect(d.month)}
          />
        ))}
      </svg>

      {hover != null && (
        <div
          className="glass-strong pointer-events-none absolute top-2 z-10 w-[190px] rounded-xl px-3 py-2.5 text-[12px]"
          style={{ left: cx(hover) + 14 + 190 <= width ? cx(hover) + 14 : Math.max(0, cx(hover) - 14 - 190) }}
        >
          <div className="mb-1.5 font-medium text-ivory">{monthLabel(data[hover].month)}</div>
          {data[hover].count === 0 ? (
            <div className="text-dim">No entries</div>
          ) : (
            <>
              {(
                [
                  ["Take-home", data[hover].net, "#f3e6cc"],
                  ["Needs", data[hover].buckets.needs, BUCKETS.needs.color],
                  ["Wants", data[hover].buckets.wants, BUCKETS.wants.color],
                  ["Savings & Debt", data[hover].buckets.savings, BUCKETS.savings.color],
                ] as const
              ).map(([l, v, c]) => (
                <div key={l} className="flex justify-between gap-3 text-mist">
                  <span className="flex items-center gap-1.5">
                    <i className="inline-block size-2 rounded-[3px]" style={{ background: c }} />
                    {l}
                  </span>
                  <b className="tnum font-medium text-ivory">{formatMoney(v, currency)}</b>
                </div>
              ))}
              <div className="mt-1.5 flex justify-between border-t border-line pt-1.5 text-mist">
                <span>Savings rate</span>
                <b className="tnum font-medium text-ivory">{formatPct(data[hover].rate)}</b>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
