"use client";

import { LogOut } from "lucide-react";
import { useUI } from "@/lib/store";
import { signOut } from "@/lib/sync";
import { cn } from "@/lib/cn";

const STATES = {
  local: { dot: "bg-mist", label: "Saved on this device" },
  idle: { dot: "bg-good", label: "Synced" },
  syncing: { dot: "bg-champagne animate-pulse", label: "Syncing…" },
  offline: { dot: "bg-warn", label: "Offline · will sync" },
  error: { dot: "bg-bad", label: "Sync problem" },
} as const;

export function SyncBadge({ compact }: { compact?: boolean }) {
  const sync = useUI((s) => s.sync);
  const session = useUI((s) => s.session);
  const st = STATES[sync];
  if (compact)
    return (
      <span className="flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[11.5px] text-mist">
        <span className={cn("size-1.5 rounded-full", st.dot)} />
        {st.label}
      </span>
    );
  return (
    <div className="rounded-2xl border border-line bg-white/[0.025] p-3.5">
      <div className="flex items-center gap-2 text-[12.5px] text-ivory">
        <span className={cn("size-1.5 rounded-full", st.dot)} />
        {st.label}
      </div>
      <div className="mt-1 truncate text-[11.5px] text-dim">
        {session?.email ?? (sync === "local" ? "Add Supabase keys to sync devices" : "")}
      </div>
      {session && (
        <button type="button" onClick={() => void signOut()} className="mt-2.5 flex cursor-pointer items-center gap-1.5 text-[12px] text-mist transition hover:text-ivory">
          <LogOut className="size-3.5" /> Sign out
        </button>
      )}
    </div>
  );
}
