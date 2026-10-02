"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * The card surface: a faint lift of the ground with a hairline edge.
 * (Named SpotlightCard for history; it no longer reacts to the cursor, and `glow` is ignored.)
 */
export function SpotlightCard({
  className,
  children,
  glow: _glow,
  as: Tag = "section",
  ...rest
}: HTMLAttributes<HTMLElement> & { glow?: string; as?: "section" | "div" | "article" }) {
  void _glow;
  return (
    <Tag className={cn("glass relative isolate min-w-0 rounded-[var(--radius-card)]", className)} {...rest}>
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
        <h2 className="font-serif text-[22px] leading-tight tracking-[-0.005em] text-ivory">{title}</h2>
        {hint ? <p className="mt-1 text-[12.5px] text-dim">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}
