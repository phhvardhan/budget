"use client";

/**
 * Digits that blur-slide when they change, animating only the characters that moved.
 * From 21st.dev "Animate Digits" by unlumen (ui.unlumen.com), lightly trimmed.
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/cn";

interface ExitItem {
  id: number;
  char: string;
  exitY: number;
}

let _id = 0;

function DigitCell({ char, isDigit, className }: { char: string; isDigit: boolean; className?: string }) {
  const [exitQueue, setExitQueue] = useState<ExitItem[]>([]);
  const prevCharRef = useRef(char);
  const first = useRef(true);
  const reduce = useReducedMotion();

  const spring = { stiffness: 170, damping: 16 };
  const y = useSpring(0, spring);
  const opacity = useSpring(1, spring);
  const scale = useSpring(1, spring);
  const blur = useSpring(0, spring);
  const filter = useTransform(blur, (v) => `blur(${v}px)`);
  const enterY = 22;

  useEffect(() => {
    if (!isDigit) return;
    const prev = prevCharRef.current;
    prevCharRef.current = char;
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduce || char === prev || !/\d/.test(prev)) return;
    const up = Number(char) > Number(prev);
    const id = _id++;
    setExitQueue((q) => [...q, { id, char: prev, exitY: up ? -enterY : enterY }].slice(-3));
    y.jump(up ? enterY : -enterY);
    opacity.jump(0);
    scale.jump(0.75);
    blur.jump(14);
    y.set(0);
    opacity.set(1);
    scale.set(1);
    blur.set(0);
  }, [char, isDigit, reduce, y, opacity, scale, blur]);

  if (!isDigit) return <span className={className}>{char}</span>;

  return (
    <span className={cn("relative inline-grid place-items-center [&>*]:col-start-1 [&>*]:row-start-1", className)}>
      <AnimatePresence>
        {exitQueue.map(({ id, char: c, exitY }) => (
          <motion.span
            key={id}
            aria-hidden
            initial={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
            animate={{ opacity: 0, scale: 0.75, filter: "blur(8px)", y: exitY }}
            transition={{ type: "spring", stiffness: 170, damping: 18 }}
            onAnimationComplete={() => setExitQueue((q) => q.filter((i) => i.id !== id))}
          >
            {c}
          </motion.span>
        ))}
      </AnimatePresence>
      <motion.span style={{ opacity, scale, filter, y }}>{char}</motion.span>
    </span>
  );
}

export function AnimateDigits({ value, className, digitClassName }: { value: string; className?: string; digitClassName?: string }) {
  const chars = value.split("");
  return (
    <span className={cn("inline-flex items-baseline tnum", className)} aria-label={value} role="text">
      {chars.map((ch, i) => (
        <DigitCell key={chars.length - i} char={ch} isDigit={/\d/.test(ch)} className={digitClassName} />
      ))}
    </span>
  );
}
