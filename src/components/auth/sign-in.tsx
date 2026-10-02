"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/fields";
import { LogoMark, Wordmark } from "@/components/shell/logo";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    const sb = supabase();
    if (!sb) return;
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address.");
    setBusy(true);
    setError(null);
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) return setError(error.message);
    setSent(true);
  };

  const verify = async () => {
    const sb = supabase();
    if (!sb || code.trim().length < 6) return;
    setBusy(true);
    setError(null);
    const { error } = await sb.auth.verifyOtp({ email, token: code.trim(), type: "email" });
    setBusy(false);
    if (error) setError("That code didn't work. Request a new one and try again.");
  };

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px]"
      >
        <div className="mb-10 flex items-center gap-3">
          <LogoMark className="size-10" />
          <Wordmark />
        </div>
        <h1 className="font-serif text-[52px] leading-[0.95] tracking-[-0.02em] text-ivory">
          Your money,
          <br />
          <span className="italic text-gradient-champagne">quietly in order.</span>
        </h1>
        <p className="mt-4 text-[14.5px] text-mist">Sign in with your email. We&apos;ll send a one-time link — no password to remember.</p>

        <div className="glass mt-8 rounded-[24px] p-5">
          <AnimatePresence mode="wait" initial={false}>
            {!sent ? (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
                className="flex flex-col gap-3"
              >
                <label htmlFor="email" className="text-[12px] font-medium text-mist">
                  Email
                </label>
                <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
                <Button type="submit" variant="primary" size="lg" disabled={busy} className="mt-1">
                  {busy ? "Sending…" : "Send sign-in link"} <ArrowRight />
                </Button>
              </motion.form>
            ) : (
              <motion.div key="sent" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-champagne/10 text-champagne">
                    <Mail className="size-5" />
                  </span>
                  <div>
                    <div className="text-[14.5px] font-medium text-ivory">Check your inbox</div>
                    <p className="text-[13px] text-mist">
                      We sent a link to <span className="text-ivory">{email}</span>. Open it on this device to sign in.
                    </p>
                  </div>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void verify();
                  }}
                  className="flex gap-2"
                >
                  <Input inputMode="numeric" autoComplete="one-time-code" placeholder="Or enter the 6-digit code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))} className="tnum tracking-[0.2em]" />
                  <Button type="submit" variant="secondary" disabled={busy || code.length < 6}>
                    Verify
                  </Button>
                </form>
                <button type="button" onClick={() => setSent(false)} className="cursor-pointer self-start text-[12.5px] text-dim transition hover:text-mist">
                  Use a different email
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          {error && <p className="mt-3 text-[13px] text-bad">{error}</p>}
        </div>
        <p className="mt-6 flex items-center gap-2 text-[12px] text-dim">
          <ShieldCheck className="size-3.5" /> Your entries are private to your account and sync between your devices.
        </p>
      </motion.div>
    </div>
  );
}
