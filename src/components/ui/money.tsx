"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";
import { useData } from "@/lib/store";
import { formatMoney, formatPct } from "@/lib/format";
import { AnimateDigits } from "./animate-digits";
import { cn } from "@/lib/cn";

export function useCurrency() {
  return useData((s) => s.settings?.currency ?? "USD");
}

/** A number that counts up when it scrolls into view and glides to new values. */
export function Money({
  value,
  decimals = false,
  className,
  signed = false,
  pct = false,
}: {
  value: number;
  decimals?: boolean;
  className?: string;
  signed?: boolean;
  pct?: boolean;
}) {
  const currency = useCurrency();
  const ref = useRef<HTMLSpanElement>(null);
  const from = useRef(0);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();

  const fmt = (v: number) => {
    if (pct) return formatPct(v);
    const s = formatMoney(Math.abs(v), currency, decimals);
    if (v < 0) return `−${s}`;
    return signed && v > 0 ? `+${s}` : s;
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      el.textContent = fmt(value);
      from.current = value;
      return;
    }
    if (!inView) return;
    const controls = animate(from.current, value, {
      duration: from.current === 0 ? 1.1 : 0.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = fmt(v);
      },
    });
    from.current = value;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, inView, currency, reduce]);

  return (
    <span ref={ref} className={cn("tnum", className)}>
      {fmt(0)}
    </span>
  );
}

/** Large figure whose digits blur-slide individually when the value changes. */
export function HeroMoney({ value, className }: { value: number; className?: string }) {
  const currency = useCurrency();
  return <AnimateDigits value={formatMoney(value, currency)} className={className} />;
}
