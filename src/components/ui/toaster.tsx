"use client";

import { AnimatePresence, motion } from "motion/react";
import { useUI } from "@/lib/store";
import { cn } from "@/lib/cn";

export function Toaster() {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismiss);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-6">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 8, scale: 0.97, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className={cn(
              "glass-strong pointer-events-auto flex max-w-full items-center gap-3 rounded-2xl py-2.5 pr-2.5 pl-4 text-[13px] font-medium",
              t.tone === "error" ? "text-bad" : "text-ivory",
            )}
            role="status"
          >
            <span className="min-w-0">{t.text}</span>
            {t.action ? (
              <button
                type="button"
                className="cursor-pointer rounded-lg bg-white/[0.08] px-2.5 py-1 text-[12.5px] text-champagne transition hover:bg-white/[0.14]"
                onClick={() => {
                  t.action!.run();
                  dismiss(t.id);
                }}
              >
                {t.action.label}
              </button>
            ) : (
              <span className="w-1.5" />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
