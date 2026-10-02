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
          animate={{ opacity: 1, height: "auto", marginBottom: 28 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className="overflow-hidden"
        >
          <p className="border-l border-champagne/40 py-0.5 pl-3.5 text-[13.5px] text-mist">
            You&apos;re looking at sample entries.{" "}
            <button
              type="button"
              className="cursor-pointer text-champagne underline decoration-champagne/30 underline-offset-4 transition hover:text-ivory"
              onClick={() => {
                useData.getState().clearSample();
                useUI.getState().toast("Sample data cleared. The ledger is all yours.");
              }}
            >
              Clear them
            </button>{" "}
            when you log your first real paycheck.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
