"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "link";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

const variants: Record<Variant, string> = {
  primary:
    "relative overflow-hidden bg-[linear-gradient(180deg,#f2e3c4,#d9c296)] text-[#1a1610] shadow-[inset_0_1px_0_rgb(255_255_255/0.6),0_8px_24px_-8px_rgb(230_211_174/0.55)] hover:brightness-[1.04] active:brightness-95 before:absolute before:inset-0 before:-translate-x-full before:bg-[linear-gradient(110deg,transparent_30%,rgb(255_255_255/0.55)_50%,transparent_70%)] before:transition-transform before:duration-700 hover:before:translate-x-full",
  secondary:
    "bg-white/[0.045] text-ivory border border-line-2 hover:bg-white/[0.08] hover:border-white/20 shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]",
  ghost: "text-mist hover:text-ivory hover:bg-white/[0.06]",
  danger: "bg-bad/10 text-bad border border-bad/25 hover:bg-bad/15",
  link: "text-champagne hover:text-ivory px-0 h-auto",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[12.5px] rounded-[10px] gap-1.5",
  md: "h-10 px-4 text-[13.5px] rounded-xl gap-2",
  lg: "h-12 px-6 text-[14.5px] rounded-2xl gap-2.5",
  icon: "h-10 w-10 rounded-xl",
  "icon-sm": "h-8 w-8 rounded-[10px]",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(function Button({ className, variant = "secondary", size = "md", type = "button", ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap font-medium tracking-[-0.005em] transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0",
        variants[variant],
        variant !== "link" && sizes[size],
        className,
      )}
      {...props}
    />
  );
});

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-line-2 bg-white/[0.04] px-1.5 font-mono text-[10.5px] text-mist",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
