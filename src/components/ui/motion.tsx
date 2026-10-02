"use client";

import { motion, type HTMLMotionProps, type Variants } from "motion/react";

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const rise: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 260, damping: 30 } },
};

/** Grid whose children rise in one after another on first paint. */
export function Stagger({ children, className, ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className={className} {...rest}>
      {children}
    </motion.div>
  );
}

export function Rise({ children, className, ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div variants={rise} className={className} {...rest}>
      {children}
    </motion.div>
  );
}

/** Bar that grows with a spring. `value` is 0..1 (clamped), color is any CSS color. */
export function Meter({
  value,
  color,
  className,
  height = 6,
  delay = 0,
}: {
  value: number;
  color: string;
  className?: string;
  height?: number;
  delay?: number;
}) {
  const v = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  return (
    <div className={`relative overflow-hidden rounded-full bg-white/[0.06] ${className ?? ""}`} style={{ height }}>
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: color, boxShadow: `0 0 18px -2px ${color}` }}
        initial={{ width: 0 }}
        animate={{ width: `${v * 100}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 22, delay }}
      />
    </div>
  );
}
