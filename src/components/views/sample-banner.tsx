"use client";

import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useData, useUI } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function SampleBanner() {
  const hasSample = useData((s) => s.entries.some((e) => e.isSample) || s.bills.some((b) => b.isSample));
  return (
    <AnimatePresence>
      {hasSample && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className="overflow-hidden"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-champagne/20 bg-[linear-gradient(90deg,rgb(230_211_174/0.09),rgb(230_211_174/0.02))] px-4 py-3">
            <span className="flex items-center gap-2.5 text-[13px] text-mist">
              <Sparkles className="size-4 shrink-0 text-champagne" />
              <span>
                <span className="text-ivory">You&apos;re exploring sample data.</span> Clear it when you log your first real paycheck.
              </span>
            </span>
            <Button
              size="sm"
              onClick={() => {
                useData.getState().clearSample();
                useUI.getState().toast("Sample data cleared. The ledger is all yours.");
              }}
            >
              Clear sample data
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
