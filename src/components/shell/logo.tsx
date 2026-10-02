"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  const id = `logo-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 64 64" className={cn("size-8", className)} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f8ecd4" />
          <stop offset="1" stopColor="#b9a07a" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="#16151b" />
      <rect x="0.5" y="0.5" width="63" height="63" rx="17.5" fill="none" stroke="#fff" strokeOpacity="0.1" />
      <path d="M14 44 C 24 44, 26 22, 36 22 S 46 30, 50 18" fill="none" stroke={`url(#${id})`} strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="50" cy="18" r="4" fill="#f8ecd4" />
      <rect x="14" y="48" width="36" height="3" rx="1.5" fill="#fff" fillOpacity="0.16" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-serif text-[22px] leading-none tracking-[-0.01em] text-ivory", className)}>
      Payday Ledger
    </span>
  );
}
