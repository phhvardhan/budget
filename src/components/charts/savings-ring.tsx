"use client";

import { motion, useReducedMotion } from "motion/react";
import { AnimateDigits } from "@/components/ui/animate-digits";

/** Savings rate as a gilded arc, with a tick where the target sits. */
export function SavingsRing({ rate, target, size = 168 }: { rate: number | null; target: number; size?: number }) {
  const reduce = useReducedMotion();
  const r = 70;
  const frac = rate == null ? 0 : Math.max(0, Math.min(1, rate));
  const tAngle = Math.max(0, Math.min(1, target)) * 2 * Math.PI - Math.PI / 2;
  const tx1 = 80 + Math.cos(tAngle) * (r - 9), ty1 = 80 + Math.sin(tAngle) * (r - 9);
  const tx2 = 80 + Math.cos(tAngle) * (r + 9), ty2 = 80 + Math.sin(tAngle) * (r + 9);
  const pct = rate == null ? "—" : `${Math.round(rate * 100)}%`;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 160 160" width={size} height={size} className="-rotate-90 overflow-visible">
        <defs>
          <linearGradient id="ring-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f8ecd4" />
            <stop offset="0.55" stopColor="#d9bf8b" />
            <stop offset="1" stopColor="#b5862a" />
          </linearGradient>
          <filter id="ring-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>
        <circle cx="80" cy="80" r={r} fill="none" stroke="rgb(255 255 255 / 0.06)" strokeWidth="10" />
        <motion.circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke="url(#ring-gold)"
          strokeWidth="10"
          strokeLinecap="round"
          filter="url(#ring-glow)"
          opacity={0.5}
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: frac }}
          transition={{ type: "spring", stiffness: 40, damping: 14, delay: 0.3 }}
        />
        <motion.circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke="url(#ring-gold)"
          strokeWidth="10"
          strokeLinecap="round"
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: frac }}
          transition={{ type: "spring", stiffness: 40, damping: 14, delay: 0.3 }}
        />
        <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke="#f3efe7" strokeWidth="2" strokeLinecap="round" opacity={0.85} />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <AnimateDigits value={pct} className="justify-center font-serif text-[44px] leading-none text-ivory" />
        <span className="eyebrow mt-2">saved</span>
      </div>
    </div>
  );
}
