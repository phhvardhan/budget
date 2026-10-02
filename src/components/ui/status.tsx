import { AlertTriangle, Check, CircleDashed, Clock, Flame } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "good" | "warn" | "bad" | "info" | "muted";

const tones: Record<Tone, string> = {
  good: "bg-good/10 text-good ring-good/20",
  warn: "bg-warn/10 text-warn ring-warn/20",
  bad: "bg-bad/10 text-bad ring-bad/25",
  info: "bg-champagne/10 text-champagne ring-champagne/20",
  muted: "bg-white/[0.04] text-mist ring-white/10",
};

const icons: Record<Tone, React.ElementType> = {
  good: Check,
  warn: AlertTriangle,
  bad: Flame,
  info: Check,
  muted: CircleDashed,
};

export function Status({
  tone,
  children,
  icon,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  icon?: "clock" | false;
  className?: string;
}) {
  const Icon = icon === "clock" ? Clock : icons[tone];
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 text-[11.5px] font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {icon !== false && <Icon className="size-3" strokeWidth={2.4} />}
      {children}
    </span>
  );
}
