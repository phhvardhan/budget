"use client";

import { motion } from "motion/react";

/** `eyebrow` is kept for callers but no longer drawn: the sidebar already says which page this is. */
export function PageHeader({
  eyebrow: _eyebrow,
  title,
  sub,
  right,
}: {
  eyebrow: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  right?: React.ReactNode;
}) {
  void _eyebrow;
  return (
    <header className="mb-9 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="display text-[40px] text-balance text-ivory sm:text-[54px]"
        >
          {title}
        </motion.h1>
        {sub ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.6 }} className="mt-4 max-w-[60ch] text-[15px] leading-relaxed text-mist">
            {sub}
          </motion.p>
        ) : null}
      </div>
      {right}
    </header>
  );
}
