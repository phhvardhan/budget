"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Eye, EyeOff, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/fields";
import { Segmented } from "@/components/ui/segmented";
import { LogoMark, Wordmark } from "@/components/shell/logo";
import { Envelope } from "@/components/envelopes/envelope";

const PREVIEW = [
  { id: "p1", name: "Groceries", bucket: "needs" as const, budget: 400, spent: 127 },
  { id: "p2", name: "Dining out", bucket: "wants" as const, budget: 300, spent: 210 },
  { id: "p3", name: "Emergency fund", bucket: "savings" as const, budget: 400, spent: 400 },
];

type Method = "password" | "link";

/** Turn Supabase auth errors into plain guidance. */
function friendly(message: string, method: Method, creating: boolean) {
  const m = message.toLowerCase();
  if (m.includes("rate limit"))
    return "Too many sign-in emails were sent in the last hour. Use password sign-in instead, or try the email link again later.";
  if (m.includes("invalid login credentials"))
    return "That email and password don't match. If you've only used email links so far, sign in with a link once, then set a password on the Budget page.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "This email already has an account. Sign in instead. If it has no password yet, use the email link once and set one on the Budget page.";
  if (m.includes("password should be") || m.includes("weak"))
    return "Choose a stronger password: at least 8 characters.";
  if (m.includes("email not confirmed"))
    return "This email hasn't been confirmed yet. Use the email link to sign in.";
  if (m.includes("signups not allowed") || m.includes("signup is disabled"))
    return "New accounts are turned off for this ledger.";
  return creating && method === "password" ? `Couldn't create the account: ${message}` : message;
}

export function SignIn() {
  const [method, setMethod] = useState<Method>("password");
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const validEmail = /^\S+@\S+\.\S+$/.test(email);

  const withPassword = async () => {
    const sb = supabase();
    if (!sb) return;
    if (!validEmail) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Passwords are at least 8 characters.");
    setBusy(true);
    setError(null);
    setNote(null);
    if (creating) {
      const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      setBusy(false);
      if (error) return setError(friendly(error.message, "password", true));
      // With email confirmation off, a session comes back and the app opens on its own.
      if (!data.session) setNote("Account created. Check your inbox to confirm it, then sign in here.");
      return;
    }
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(friendly(error.message, "password", false));
  };

  const sendLink = async () => {
    const sb = supabase();
    if (!sb) return;
    if (!validEmail) return setError("Enter a valid email address.");
    setBusy(true);
    setError(null);
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) return setError(friendly(error.message, "link", false));
    setSent(true);
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
        <h1 className="display text-[48px] text-ivory sm:text-[54px]">
          Your money,
          <br />
          quietly in order.
        </h1>
        <p className="mt-4 text-[14.5px] text-mist">Sign in to sync your ledger across your devices. You stay signed in until you sign out.</p>
        <div inert aria-hidden className="mt-8 grid grid-cols-3 gap-3">
          {PREVIEW.map((e, i) => (
            <Envelope key={e.id} data={e} currency="USD" index={i} />
          ))}
        </div>

        <div className="glass mt-8 rounded-[24px] p-5">
          <Segmented
            label="Sign-in method"
            className="mb-5 w-full"
            value={method}
            onChange={(m) => {
              setMethod(m);
              setError(null);
              setNote(null);
            }}
            options={[
              { value: "password", label: "Password" },
              { value: "link", label: "Email link" },
            ]}
          />

          <AnimatePresence mode="wait" initial={false}>
            {method === "password" ? (
              <motion.form
                key={creating ? "create" : "signin"}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  void withPassword();
                }}
                className="flex flex-col gap-3"
              >
                <label htmlFor="pw-email" className="text-[12px] font-medium text-mist">
                  Email
                </label>
                <Input id="pw-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
                <label htmlFor="pw-password" className="mt-1 text-[12px] font-medium text-mist">
                  {creating ? "Choose a password" : "Password"}
                </label>
                <div className="relative">
                  <Input
                    id="pw-password"
                    type={show ? "text" : "password"}
                    autoComplete={creating ? "new-password" : "current-password"}
                    placeholder={creating ? "At least 8 characters" : "Your password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? "Hide password" : "Show password"}
                    className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-dim transition hover:text-ivory"
                  >
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <Button type="submit" variant="primary" size="lg" disabled={busy} className="mt-2">
                  {busy ? (creating ? "Creating…" : "Signing in…") : creating ? "Create account" : "Sign in"} <ArrowRight />
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setCreating((c) => !c);
                    setError(null);
                    setNote(null);
                  }}
                  className="cursor-pointer self-start text-[12.5px] text-dim transition hover:text-mist"
                >
                  {creating ? "Already have an account? Sign in" : "New here? Create an account"}
                </button>
              </motion.form>
            ) : !sent ? (
              <motion.form
                key="link"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendLink();
                }}
                className="flex flex-col gap-3"
              >
                <label htmlFor="link-email" className="text-[12px] font-medium text-mist">
                  Email
                </label>
                <Input id="link-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
                <Button type="submit" variant="primary" size="lg" disabled={busy} className="mt-1">
                  {busy ? "Sending…" : "Send sign-in link"} <ArrowRight />
                </Button>
                <p className="text-[12px] text-dim">Open the link in this same browser. Only a few links can be sent per hour.</p>
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
                      We sent a link to <span className="text-ivory">{email}</span>. Open it in this browser to sign in, then set a password on the Budget page so you won&apos;t need links again.
                    </p>
                  </div>
                </div>
                <button type="button" onClick={() => setSent(false)} className="cursor-pointer self-start text-[12.5px] text-dim transition hover:text-mist">
                  Use a different email
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          {error && <p className="mt-3 text-[13px] text-bad">{error}</p>}
          {note && <p className="mt-3 text-[13px] text-good">{note}</p>}
        </div>
        <p className="mt-6 flex items-center gap-2 text-[12px] text-dim">
          <ShieldCheck className="size-3.5" /> Your entries are private to your account and sync between your devices.
        </p>
      </motion.div>
    </div>
  );
}
