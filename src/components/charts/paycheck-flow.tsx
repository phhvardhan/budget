"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { Category, MonthSummary } from "@/lib/types";
import { BUCKETS, LEFTOVER_COLOR, OTHER_COLOR } from "@/lib/defaults";
import { formatMoney, formatPct } from "@/lib/format";
import { useWidth } from "./use-width";

interface FNode {
  id: string;
  label: string;
  value: number;
  color: string;
  col: number;
  x: number;
  y: number;
  h: number;
  hatched?: boolean;
}
interface FLink {
  id: string;
  source: string;
  target: string;
  value: number;
  sy?: number;
  ty?: number;
  w?: number;
}

const NODE_W = 8;
const GAP = 14;

/**
 * Paycheck flow: gross → taxes / take-home → Needs · Wants · Savings · Left over → biggest categories.
 * A Sankey drawn by hand so every ribbon can draw itself in and be traced on hover.
 */
export function PaycheckFlow({
  summary,
  categories,
  takeHome,
  currency,
}: {
  summary: MonthSummary;
  categories: Category[];
  takeHome: number;
  currency: string;
}) {
  const [wrapRef, width] = useWidth<HTMLDivElement>(900);
  const [hover, setHover] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const compact = width < 620;
  const H = compact ? 300 : 360;

  const graph = useMemo(() => {
    const s = summary;
    const base = s.hasIncome ? s.net : takeHome;
    const nodes: Omit<FNode, "x" | "y" | "h">[] = [];
    const links: FLink[] = [];
    if (base <= 0 && s.outflow <= 0) return null;

    let col = 0;
    const showGross = s.hasIncome && s.deductions > 0 && !compact;
    if (showGross) {
      nodes.push({ id: "gross", label: "Gross pay", value: s.gross, color: "#d8d2c6", col: 0 });
      nodes.push({ id: "tax", label: "Taxes & deductions", value: s.deductions, color: OTHER_COLOR, col: 1 });
      links.push({ id: "gross-tax", source: "gross", target: "tax", value: s.deductions });
      links.push({ id: "gross-net", source: "gross", target: "net", value: s.net });
      col = 1;
    }
    const netLabel = s.hasIncome ? "Take-home" : "Expected take-home";
    if (base > 0) nodes.push({ id: "net", label: netLabel, value: base, color: "#e6d3ae", col });
    const over = Math.max(s.outflow - Math.max(base, 0), 0);
    if (over > 0) nodes.push({ id: "over", label: "Overspent", value: over, color: "#ee8a84", col, hatched: true });

    const bcol = col + 1;
    const spentTotal = s.outflow || 1;
    const bucketIds: [string, string, number, string][] = [
      ["needs", BUCKETS.needs.label, s.buckets.needs, BUCKETS.needs.color],
      ["wants", BUCKETS.wants.label, s.buckets.wants, BUCKETS.wants.color],
      ["savings", BUCKETS.savings.label, s.buckets.savings, BUCKETS.savings.color],
      ["other", "Uncategorized", s.buckets.other, OTHER_COLOR],
    ];
    for (const [id, label, v, color] of bucketIds) {
      if (v <= 0) continue;
      nodes.push({ id, label, value: v, color, col: bcol });
      const fromNet = base > 0 ? (over > 0 ? (v * base) / spentTotal : v) : 0;
      if (fromNet > 0) links.push({ id: `net-${id}`, source: "net", target: id, value: fromNet });
      if (over > 0) links.push({ id: `over-${id}`, source: "over", target: id, value: (v * over) / spentTotal });
    }
    const left = base - s.outflow;
    if (left > 0) {
      nodes.push({ id: "left", label: "Left over", value: left, color: LEFTOVER_COLOR, col: bcol, hatched: true });
      links.push({ id: "net-left", source: "net", target: "left", value: left });
    }

    if (!compact && s.outflow > 0) {
      const byId = new Map(categories.map((c) => [c.id, c]));
      const cats = Object.entries(s.byCategory)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1]);
      const top = cats.slice(0, 6);
      const rest = cats.slice(6);
      const ccol = bcol + 1;
      for (const [cid, v] of top) {
        const c = byId.get(cid);
        const bucket = c ? c.bucket : "other";
        nodes.push({ id: `c-${cid}`, label: c ? c.name : "Uncategorized", value: v, color: c ? BUCKETS[c.bucket].color : OTHER_COLOR, col: ccol });
        links.push({ id: `${bucket}-c-${cid}`, source: bucket, target: `c-${cid}`, value: v });
      }
      if (rest.length) {
        const total = rest.reduce((a, [, v]) => a + v, 0);
        nodes.push({ id: "c-rest", label: `${rest.length} more categories`, value: total, color: "#8f8a98", col: ccol });
        const per: Record<string, number> = {};
        for (const [cid, v] of rest) {
          const b = byId.get(cid)?.bucket ?? "other";
          per[b] = (per[b] || 0) + v;
        }
        for (const [b, v] of Object.entries(per)) links.push({ id: `${b}-c-rest`, source: b, target: "c-rest", value: v });
      }
    }

    // ---- layout
    const cols = Math.max(...nodes.map((n) => n.col)) + 1;
    const labelW = compact ? 124 : 196;
    const padT = 10;
    const innerH = H - padT * 2;
    const colNodes = Array.from({ length: cols }, (_, c) => nodes.filter((n) => n.col === c));
    const k = Math.min(
      ...colNodes.map((ns) => {
        const total = ns.reduce((a, n) => a + n.value, 0);
        return total > 0 ? (innerH - (ns.length - 1) * GAP) / total : Infinity;
      }),
    );
    const span = Math.max(width - labelW - NODE_W, 120);
    const placed: FNode[] = [];
    colNodes.forEach((ns, c) => {
      const total = ns.reduce((a, n) => a + Math.max(n.value * k, 2), 0) + (ns.length - 1) * GAP;
      let y = padT + (innerH - total) / 2;
      const x = cols === 1 ? 0 : (c * span) / (cols - 1);
      for (const n of ns) {
        const h = Math.max(n.value * k, 2);
        placed.push({ ...n, x, y, h });
        y += h + GAP;
      }
    });
    const byNode = new Map(placed.map((n) => [n.id, n]));
    const outY = new Map(placed.map((n) => [n.id, n.y]));
    const inY = new Map(placed.map((n) => [n.id, n.y]));
    const ordered = [...links].sort((a, b) => {
      const ta = byNode.get(a.target)!, tb = byNode.get(b.target)!;
      const sa = byNode.get(a.source)!, sb = byNode.get(b.source)!;
      return sa.y - sb.y || ta.y - tb.y;
    });
    for (const l of ordered) {
      const w = l.value * k;
      l.w = w;
      l.sy = outY.get(l.source)!;
      outY.set(l.source, l.sy + w);
    }
    for (const l of [...ordered].sort((a, b) => byNode.get(a.source)!.y - byNode.get(b.source)!.y)) {
      l.ty = inY.get(l.target)!;
      inY.set(l.target, l.ty + (l.w ?? 0));
    }
    return { nodes: placed, links: ordered.filter((l) => byNode.has(l.source) && byNode.has(l.target)), byNode, base };
  }, [summary, categories, takeHome, width, compact, H]);

  if (!graph) {
    return (
      <div ref={wrapRef} className="grid h-[220px] place-items-center text-center text-[13px] text-dim">
        Log a paycheck or an expense and the flow of your money draws itself here.
      </div>
    );
  }

  const { nodes, links, byNode, base } = graph;
  const ribbon = (l: FLink) => {
    const s = byNode.get(l.source)!, t = byNode.get(l.target)!;
    const x0 = s.x + NODE_W, x1 = t.x, xm = (x0 + x1) / 2;
    const y0 = l.sy!, y1 = l.ty!, w = l.w!;
    return `M${x0},${y0}C${xm},${y0} ${xm},${y1} ${x1},${y1}L${x1},${y1 + w}C${xm},${y1 + w} ${xm},${y0 + w} ${x0},${y0 + w}Z`;
  };
  const active = (l: FLink) => !hover || hover === l.id || hover === l.source || hover === l.target;
  const hovered = links.find((l) => l.id === hover);
  const hoveredNode = nodes.find((n) => n.id === hover);

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} className="block overflow-visible" role="img" aria-label="How this month's pay flowed into needs, wants, savings and what's left">
        <defs>
          {links.map((l) => {
            const s = byNode.get(l.source)!, t = byNode.get(l.target)!;
            return (
              <linearGradient key={l.id} id={`lg-${l.id}`} gradientUnits="userSpaceOnUse" x1={s.x + NODE_W} x2={t.x} y1={0} y2={0}>
                <stop offset="0%" stopColor={s.color} />
                <stop offset="100%" stopColor={t.color} />
              </linearGradient>
            );
          })}
          <clipPath id="flow-reveal">
            <motion.rect
              x={0}
              y={-20}
              height={H + 40}
              initial={{ width: reduce ? width : 0 }}
              animate={{ width }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
            />
          </clipPath>
          <pattern id="flow-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="rgb(230 211 174 / 0.18)" />
            <rect width="2" height="6" fill="rgb(230 211 174 / 0.55)" />
          </pattern>
        </defs>

        <g clipPath="url(#flow-reveal)">
          {links.map((l) => (
            <path
              key={l.id}
              d={ribbon(l)}
              fill={`url(#lg-${l.id})`}
              style={{ opacity: active(l) ? (hover ? 0.55 : 0.24) : 0.06, transition: "opacity 300ms ease" }}
              onPointerEnter={() => setHover(l.id)}
              onPointerLeave={() => setHover(null)}
            />
          ))}
        </g>

        {nodes.map((n, i) => (
          <g key={n.id} onPointerEnter={() => setHover(n.id)} onPointerLeave={() => setHover(null)} className="cursor-default">
            <motion.rect
              x={n.x}
              y={n.y}
              width={NODE_W}
              height={n.h}
              rx={3}
              fill={n.hatched ? "url(#flow-hatch)" : n.color}
              stroke={n.hatched ? n.color : "none"}
              strokeOpacity={0.6}
              initial={reduce ? false : { scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              style={{ originY: 0.5 }}
              transition={{ type: "spring", stiffness: 140, damping: 20, delay: 0.1 + n.col * 0.22 + i * 0.015 }}
            />
            <motion.text
              x={n.x + NODE_W + 9}
              y={n.y + n.h / 2}
              dominantBaseline="middle"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: !hover || hover === n.id || links.some((l) => l.id === hover && (l.source === n.id || l.target === n.id)) ? 1 : 0.35 }}
              transition={{ duration: 0.5, delay: reduce ? 0 : 0.35 + n.col * 0.22 }}
              className="pointer-events-none select-none"
            >
              <tspan fontSize={compact ? 11 : 11.5} fill="#aaa5b2">
                {n.label.length > (compact ? 14 : 22) ? `${n.label.slice(0, compact ? 13 : 21).trimEnd()}…` : n.label}
              </tspan>
              <tspan dx={7} fontSize={compact ? 12 : 13} fontWeight={500} fill="#f3efe7" style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatMoney(n.value, currency)}
              </tspan>
            </motion.text>
          </g>
        ))}
      </svg>

      {(hovered || hoveredNode) && (
        <div className="glass-strong pointer-events-none absolute top-0 right-0 rounded-xl px-3 py-2 text-[12px]">
          {hovered ? (
            <>
              <div className="text-mist">
                {byNode.get(hovered.source)!.label} <span className="text-dim">→</span> {byNode.get(hovered.target)!.label}
              </div>
              <div className="tnum mt-0.5 font-medium text-ivory">
                {formatMoney(hovered.value, currency, true)}
                {base > 0 && <span className="ml-2 text-dim">{formatPct(hovered.value / base)} of take-home</span>}
              </div>
            </>
          ) : hoveredNode ? (
            <>
              <div className="text-mist">{hoveredNode.label}</div>
              <div className="tnum mt-0.5 font-medium text-ivory">
                {formatMoney(hoveredNode.value, currency, true)}
                {base > 0 && hoveredNode.id !== "gross" && <span className="ml-2 text-dim">{formatPct(hoveredNode.value / base)} of take-home</span>}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
