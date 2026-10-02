import { cn } from "@/lib/cn";

type Tone = "good" | "warn" | "bad" | "info" | "muted";

const tones: Record<Tone, { text: string; dot: string }> = {
  good: { text: "text-good", dot: "bg-good" },
  warn: { text: "text-warn", dot: "bg-warn" },
  bad: { text: "text-bad", dot: "bg-bad" },
  info: { text: "text-champagne", dot: "bg-champagne" },
  muted: { text: "text-dim", dot: "bg-white/25" },
};

/** A status written in words with a small coloured mark; no pill, no icon. */
export function Status({
  tone,
  children,
  icon: _icon,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  icon?: "clock" | false;
  className?: string;
}) {
  void _icon;
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[12px] font-medium", tones[tone].text, className)}>
      <span className={cn("size-[5px] rounded-full", tones[tone].dot)} />
      {children}
    </span>
  );
}
