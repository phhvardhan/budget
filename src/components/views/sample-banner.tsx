"use client";

import { AnimatePresence, motion } from "motion/react";
import { useData, useUI } from "@/lib/store";

export function SampleBanner() {
  const hasSample = useData((s) => s.entries.some((e) => e.isSample) || s.bills.some((b) => b.isSample));
  return (
    <AnimatePresence>
      {hasSample && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: "auto", marginBottom: 36 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className="overflow-hidden"
        >
          <p className="flex items-start gap-2.5 border-l-2 border-champagne/50 py-1 pl-3.5 text-[14px] text-mist">
            <span>
              You&apos;re looking at sample entries.{" "}
              <button
                type="button"
                className="cursor-pointer text-champagne underline decoration-champagne/40 underline-offset-4 hover:text-ivory"
                onClick={() => {
                  useData.getState().clearSample();
                  useUI.getState().toast("Sample data cleared. The ledger is all yours.");
                }}
              >
                Clear them
              </button>{" "}
              when you log your first real paycheck.
            </span>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
