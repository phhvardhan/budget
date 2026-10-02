"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import { X } from "lucide-react";
import { Button } from "./button";

function useIsMobile() {
  const [m, setM] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches);
  useEffect(() => {
    const q = window.matchMedia("(max-width: 767px)");
    const on = () => setM(q.matches);
    q.addEventListener("change", on);
    return () => q.removeEventListener("change", on);
  }, []);
  return m;
}

/** Right-hand panel on desktop, draggable bottom sheet on phones. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const mobile = useIsMobile();
  const drag = useDragControls();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={
              mobile
                ? "glass-strong absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-[28px] pb-[env(safe-area-inset-bottom)]"
                : "glass-strong absolute inset-y-3 right-3 flex w-[min(460px,calc(100%-24px))] flex-col rounded-[26px]"
            }
            initial={mobile ? { y: "100%", x: 0, opacity: 1, filter: "blur(0px)" } : { x: 40, y: 0, opacity: 0, filter: "blur(8px)" }}
            animate={{ x: 0, y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={mobile ? { y: "100%" } : { x: 40, opacity: 0, filter: "blur(8px)" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            drag={mobile ? "y" : false}
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
          >
            {mobile && (
              <div className="flex cursor-grab justify-center pt-3 pb-1 touch-none" onPointerDown={(e) => drag.start(e)}>
                <span className="h-1.5 w-10 rounded-full bg-white/20" />
              </div>
            )}
            <div className="flex items-center justify-between gap-3 px-6 pt-4 pb-3 md:pt-6">
              <h2 className="font-serif text-[28px] leading-none tracking-[-0.01em] text-ivory">{title}</h2>
              <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
                <X />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pt-2 pb-6">{children}</div>
            {footer ? <div className="flex items-center gap-2 border-t border-line px-6 py-4">{footer}</div> : null}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
