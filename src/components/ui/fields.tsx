"use client";

import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const base =
  "h-11 w-full min-w-0 rounded-xl border border-line-2 bg-white/[0.035] px-3.5 text-[14px] text-ivory placeholder:text-dim outline-none transition-[border-color,background-color,box-shadow] duration-200 hover:border-white/20 focus:border-champagne/60 focus:bg-white/[0.05] focus:shadow-[0_0_0_4px_rgb(230_211_174/0.08)]";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(base, className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select ref={ref} className={cn(base, "cursor-pointer", className)} {...props}>
      {children}
    </select>
  );
});

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[12px] font-medium text-mist">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[11.5px] text-dim">{hint}</p> : null}
    </div>
  );
}
