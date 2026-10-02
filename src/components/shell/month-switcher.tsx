"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useUI } from "@/lib/store";
import { addMonths, monthLabel, thisMonth } from "@/lib/dates";
import { cn } from "@/lib/cn";

export function MonthSwitcher({ step = 1, mode = "month", className }: { step?: number; mode?: "month" | "year"; className?: string }) {
  const month = useUI((s) => s.month);
  const [dir, setDir] = useState(1);
  const go = (n: number) => {
    setDir(n);
    useUI.getState().set({ month: addMonths(month, n * step) });
  };
  const label = mode === "year" ? month.slice(0, 4) : monthLabel(month);
  const isNow = mode === "year" ? month.slice(0, 4) === thisMonth().slice(0, 4) : month === thisMonth();
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center rounded-[14px] border border-line bg-white/[0.03] p-1">
        <button type="button" onClick={() => go(-1)} aria-label={`Previous ${mode}`} className="grid size-8 cursor-pointer place-items-center rounded-[10px] text-mist transition hover:bg-white/[0.07] hover:text-ivory">
          <ChevronLeft className="size-4" />
        </button>
        <div className="relative h-8 w-[132px] overflow-hidden">
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.span
              key={label}
              custom={dir}
              variants={{
                enter: (d: number) => ({ x: d * 28, opacity: 0, filter: "blur(4px)" }),
                center: { x: 0, opacity: 1, filter: "blur(0px)" },
                exit: (d: number) => ({ x: d * -28, opacity: 0, filter: "blur(4px)" }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
              className="absolute inset-0 grid place-items-center text-[13.5px] font-medium text-ivory"
            >
              {label}
            </motion.span>
          </AnimatePresence>
        </div>
        <button type="button" onClick={() => go(1)} aria-label={`Next ${mode}`} className="grid size-8 cursor-pointer place-items-center rounded-[10px] text-mist transition hover:bg-white/[0.07] hover:text-ivory">
          <ChevronRight className="size-4" />
        </button>
      </div>
      <AnimatePresence>
        {!isNow && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => useUI.getState().set({ month: thisMonth() })}
            className="h-10 cursor-pointer rounded-[14px] px-3 text-[12.5px] text-champagne transition hover:bg-white/[0.05]"
          >
            Today
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
