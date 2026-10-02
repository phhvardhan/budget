"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Command, Plus } from "lucide-react";
import { useData, useUI } from "@/lib/store";
import { bootSync } from "@/lib/sync";
import { cloudEnabled } from "@/lib/supabase";
import { addMonths } from "@/lib/dates";
import { openEntry } from "@/lib/hooks";
import { NAV, isActive } from "./nav";
import { LogoMark, Wordmark } from "./logo";
import { SyncBadge } from "./sync-badge";
import { SignIn } from "@/components/auth/sign-in";
import { Welcome } from "@/components/auth/welcome";
import { EntrySheet } from "@/components/entries/entry-sheet";
import { BillSheet } from "@/components/entries/bill-sheet";
import { QuickAdd } from "@/components/command/quick-add";
import { Toaster } from "@/components/ui/toaster";
import { Kbd } from "@/components/ui/button";
import { cn } from "@/lib/cn";

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <motion.div initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} transition={{ duration: 0.6 }} className="flex flex-col items-center gap-4">
        <LogoMark className="size-14" />
        <div className="h-px w-20 animate-shimmer bg-[linear-gradient(90deg,transparent,rgb(230_211_174/0.6),transparent)] bg-[length:200%_100%]" />
      </motion.div>
    </div>
  );
}

function useShortcuts() {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      const ui = useUI.getState();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ui.set({ quickAdd: !ui.quickAdd });
        return;
      }
      if (typing || ui.sheetOpen || ui.quickAdd || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "/") {
        e.preventDefault();
        ui.set({ quickAdd: true });
      } else if (e.key === "n") openEntry("expense");
      else if (e.key === "i") openEntry("income");
      else if (e.key === "[") ui.set({ month: addMonths(ui.month, -1) });
      else if (e.key === "]") ui.set({ month: addMonths(ui.month, 1) });
      else if (/^[1-6]$/.test(e.key)) router.push(NAV[Number(e.key) - 1].href);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrated = useUI((s) => s.hydrated);
  const authReady = useUI((s) => s.authReady);
  const session = useUI((s) => s.session);
  const settings = useData((s) => s.settings);
  const lastSyncedAt = useData((s) => s.lastSyncedAt);
  const pathname = usePathname();
  useShortcuts();

  useEffect(() => {
    bootSync();
  }, []);

  if (!hydrated || !authReady) return <Splash />;
  if (cloudEnabled && !session) return <SignIn />;
  // In cloud mode wait for the first pull before deciding the user is new.
  if (!settings && cloudEnabled && !lastSyncedAt) return <Splash />;
  if (!settings) return <Welcome />;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1480px]">
      <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col gap-8 px-5 py-7 lg:flex">
        <Link href="/" className="flex items-center gap-3 px-2">
          <LogoMark />
          <Wordmark className="text-[21px]" />
        </Link>
        <button
          type="button"
          onClick={() => useUI.getState().set({ quickAdd: true })}
          className="group flex cursor-pointer items-center gap-2.5 rounded-[11px] border border-line px-3.5 py-2.5 text-left text-[13px] text-mist transition hover:border-line-2 hover:text-ivory"
        >
          <Plus className="size-4 text-champagne transition group-hover:rotate-90" />
          <span className="flex-1">Quick add</span>
          <Kbd>
            <Command className="size-2.5" />K
          </Kbd>
        </button>
        <nav className="flex flex-col gap-0.5">
          {NAV.map((n) => {
            const active = isActive(pathname, n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium transition-colors",
                  active ? "text-ivory" : "text-dim hover:text-mist",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-[10px] bg-white/[0.04]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                {active && (
                  <motion.span layoutId="nav-dot" className="absolute top-1/2 -left-5 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-champagne" />
                )}
                <n.icon className={cn("relative size-[17px]", active && "text-champagne")} strokeWidth={1.8} />
                <span className="relative">{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <SyncBadge />
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 pt-[max(20px,env(safe-area-inset-top))] pb-[calc(120px+env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:pt-10 lg:pb-16">
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="size-7" />
            <Wordmark className="text-[19px]" />
          </Link>
          <SyncBadge compact />
        </div>
        {children}
      </main>

      <MobileDock pathname={pathname} />
      <EntrySheet />
      <BillSheet />
      <QuickAdd />
      <Toaster />
    </div>
  );
}

function MobileDock({ pathname }: { pathname: string }) {
  const items = NAV.slice(0, 5);
  const left = items.slice(0, 2);
  const right = items.slice(2, 5);
  const Item = ({ n }: { n: (typeof NAV)[number] }) => {
    const active = isActive(pathname, n.href);
    return (
      <Link href={n.href} aria-label={n.label} className="relative grid h-12 flex-1 place-items-center">
        {active && <motion.span layoutId="dock-active" className="absolute inset-1 rounded-2xl bg-white/[0.08]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
        <n.icon className={cn("relative size-[19px] transition-colors", active ? "text-champagne" : "text-dim")} strokeWidth={1.9} />
      </Link>
    );
  };
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(14px,env(safe-area-inset-bottom))] lg:hidden" aria-label="Sections">
      <div className="glass-strong mx-auto flex max-w-[460px] items-center gap-1 rounded-[24px] p-1.5">
        {left.map((n) => (
          <Item key={n.href} n={n} />
        ))}
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => useUI.getState().set({ quickAdd: true })}
          aria-label="Quick add"
          className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-[16px] bg-champagne text-[#17140f]"
        >
          <Plus className="size-5" strokeWidth={2.4} />
        </motion.button>
        {right.map((n) => (
          <Item key={n.href} n={n} />
        ))}
      </div>
    </nav>
  );
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
