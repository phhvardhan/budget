"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { signOut } from "@/lib/sync";
import { useUI } from "@/lib/store";
import { SpotlightCard, CardHeader } from "@/components/ui/spotlight-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/fields";

/** Signed-in account: shows the email and lets the person set or change a password. */
export function AccountCard() {
  const session = useUI((s) => s.session);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) return null;

  const save = async () => {
    const sb = supabase();
    if (!sb) return;
    if (password.length < 8) return setError("Use at least 8 characters.");
    setBusy(true);
    setError(null);
    const { error } = await sb.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      const m = error.message.toLowerCase();
      setError(
        m.includes("different from the old")
          ? "That's already your password."
          : m.includes("reauthentication") || m.includes("recent")
            ? "For security, sign out and back in, then set the password again."
            : error.message,
      );
      return;
    }
    setPassword("");
    useUI.getState().toast("Password saved. Use it to sign in on any device.");
  };

  return (
    <SpotlightCard className="p-6">
      <CardHeader title="Your account" hint={<>Signed in as <span className="text-ivory">{session.email ?? "your account"}</span></>} />
      <form
        className="mt-5 flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <label htmlFor="acct-password" className="text-[12px] font-medium text-mist">
          Set or change password
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="acct-password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
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
          <Button type="submit" variant="secondary" disabled={busy || !password} className="h-11">
            <KeyRound /> {busy ? "Saving…" : "Save"}
          </Button>
        </div>
        {error ? <p className="text-[12.5px] text-bad">{error}</p> : <p className="text-[11.5px] text-dim">With a password you can sign in on new devices without waiting for an email.</p>}
      </form>
      <Button variant="ghost" size="sm" className="mt-4 -ml-2" onClick={() => void signOut()}>
        <LogOut /> Sign out
      </Button>
    </SpotlightCard>
  );
}
