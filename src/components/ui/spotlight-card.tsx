"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * A quiet panel: a faint paper tint and a hairline edge. No glow and no hover effect,
 * so the envelopes stay the only thing on screen that asks to be looked at.
 * (Named SpotlightCard for history; `glow` is accepted and ignored.)
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
    <Tag
      className={cn(
        "relative isolate min-w-0 rounded-[var(--radius-card)] border border-line bg-[rgb(255_255_255/0.022)] shadow-[inset_0_1px_0_rgb(255_255_255/0.035)]",
        className,
      )}
      {...rest}
    >
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
        <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-ivory [font-stretch:92%]">{title}</h2>
        {hint ? <p className="mt-0.5 text-[13px] text-dim">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}
