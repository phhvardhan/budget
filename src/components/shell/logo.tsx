"use client";

import { cn } from "@/lib/cn";

/** A cash envelope with a note standing up out of it. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-8", className)} aria-hidden>
      <rect x="7" y="22" width="50" height="34" rx="5" fill="#26222c" />
      <g transform="rotate(-7 32 26)">
        <rect x="17" y="7" width="30" height="34" rx="3" fill="#e6d3ae" />
        <rect x="20.5" y="10.5" width="23" height="27" rx="1.5" fill="none" stroke="#7a6844" strokeOpacity="0.55" strokeWidth="1.4" />
        <circle cx="32" cy="20" r="4.2" fill="none" stroke="#7a6844" strokeOpacity="0.7" strokeWidth="1.6" />
      </g>
      <path d="M7 33h18.5c2.2 0 3.4 4.6 6.5 4.6s4.3-4.6 6.5-4.6H57v18a5 5 0 0 1-5 5H12a5 5 0 0 1-5-5z" fill="#3a3441" />
      <path d="M7.6 54.5 32 44l24.4 10.5" fill="none" stroke="#fff" strokeOpacity="0.13" strokeWidth="1.3" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return <span className={cn("text-[20px] leading-none font-semibold tracking-[-0.03em] text-ivory [font-stretch:84%]", className)}>Payday Ledger</span>;
}
