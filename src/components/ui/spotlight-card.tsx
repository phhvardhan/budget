"use client";

import { useRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Glass card with a cursor-following spotlight and a glowing hairline border.
 * Adapted from 21st.dev "Spotlight Card" (preetsuthar17); position is written to CSS
 * variables instead of React state so moving the mouse never re-renders the card.
 */
export function SpotlightCard({
  className,
  children,
  glow = "230 211 174",
  as: Tag = "section",
  ...rest
}: HTMLAttributes<HTMLElement> & { glow?: string; as?: "section" | "div" | "article" }) {
  const ref = useRef<HTMLElement>(null);
  return (
    <Tag
      ref={ref as never}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--x", `${e.clientX - r.left}px`);
        el.style.setProperty("--y", `${e.clientY - r.top}px`);
      }}
      className={cn(
        "group/spot glass relative isolate min-w-0 overflow-hidden rounded-[var(--radius-card)]",
        className,
      )}
      style={{ ["--glow" as string]: glow }}
      {...rest}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{
          background:
            "radial-gradient(520px circle at var(--x, 50%) var(--y, 0%), rgb(var(--glow) / 0.075), transparent 45%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{
          padding: 1,
          background:
            "radial-gradient(360px circle at var(--x, 50%) var(--y, 0%), rgb(var(--glow) / 0.45), transparent 40%)",
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  hint,
  action,
  className,
}: {
  title: React.ReactNode;
  hint?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-x-4 gap-y-1", className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-medium tracking-[-0.01em] text-ivory">{title}</h2>
        {hint ? <p className="mt-0.5 text-[12.5px] text-dim">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}
