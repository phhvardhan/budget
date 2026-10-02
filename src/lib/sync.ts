"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase, cloudEnabled } from "./supabase";
import { bindSync, useData, useUI } from "./store";
import type { Bill, Category, Entry, OutboxOp, Settings, TableName } from "./types";

/* ------------------------------------------------------------ row mapping */

type Row = Record<string, unknown>;

const toRow = {
  settings: (s: Settings, user_id: string): Row => ({
    user_id,
    take_home: s.takeHome,
    currency: s.currency,
    targets: s.targets,
    updated_at: s.updatedAt ?? new Date().toISOString(),
  }),
  categories: (c: Category, user_id: string): Row => ({
    id: c.id,
    user_id,
    name: c.name,
    bucket: c.bucket,
    budget: c.budget,
    sort: c.sort,
  }),
  entries: (e: Entry, user_id: string): Row => ({
    id: e.id,
    user_id,
    type: e.type,
    date: e.date,
    amount: e.type === "expense" ? e.amount : null,
    gross: e.type === "income" ? e.gross : null,
    deductions: e.type === "income" ? e.deductions : null,
    category_id: e.type === "expense" ? e.categoryId : null,
    description: e.type === "expense" ? e.description : null,
    source: e.type === "income" ? e.source : null,
    method: e.type === "expense" ? e.method ?? null : null,
    kind: e.type === "expense" ? e.kind ?? null : null,
    bill_id: e.type === "expense" ? e.billId ?? null : null,
    note: e.note ?? null,
    is_sample: !!e.isSample,
    created_at: e.createdAt ?? new Date().toISOString(),
  }),
  bills: (b: Bill, user_id: string): Row => ({
    id: b.id,
    user_id,
    name: b.name,
    category_id: b.categoryId,
    amount: b.amount,
    due_day: b.dueDay,
    autopay: b.autopay,
    method: b.method ?? null,
    is_sample: !!b.isSample,
  }),
};

const num = (v: unknown) => (v == null ? 0 : Number(v));

const fromRow = {
  settings: (r: Row): Settings => ({
    takeHome: num(r.take_home),
    currency: String(r.currency ?? "USD"),
    targets: (r.targets as Settings["targets"]) ?? { needs: 0.5, wants: 0.3, savings: 0.2 },
    updatedAt: r.updated_at as string,
  }),
  categories: (r: Row): Category => ({
    id: r.id as string,
    name: r.name as string,
    bucket: r.bucket as Category["bucket"],
    budget: num(r.budget),
    sort: num(r.sort),
  }),
  entries: (r: Row): Entry =>
    r.type === "income"
      ? {
          id: r.id as string,
          type: "income",
          date: String(r.date),
          gross: num(r.gross),
          deductions: num(r.deductions),
          source: (r.source as string) ?? "Salary",
          note: (r.note as string) ?? undefined,
          isSample: !!r.is_sample,
          createdAt: r.created_at as string,
        }
      : {
          id: r.id as string,
          type: "expense",
          date: String(r.date),
          amount: num(r.amount),
          categoryId: (r.category_id as string) ?? null,
          description: (r.description as string) ?? "",
          method: (r.method as string) ?? undefined,
          kind: (r.kind as "Fixed" | "Variable") ?? "Variable",
          billId: (r.bill_id as string) ?? null,
          note: (r.note as string) ?? undefined,
          isSample: !!r.is_sample,
          createdAt: r.created_at as string,
        },
  bills: (r: Row): Bill => ({
    id: r.id as string,
    name: r.name as string,
    categoryId: (r.category_id as string) ?? null,
    amount: r.amount == null ? null : num(r.amount),
    dueDay: num(r.due_day) || 1,
    autopay: !!r.autopay,
    method: (r.method as string) ?? undefined,
    isSample: !!r.is_sample,
  }),
};

/* ------------------------------------------------------------- pull/push */

const ORDER: TableName[] = ["settings", "categories", "bills", "entries"];
let flushing = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let channel: RealtimeChannel | null = null;

function isNetworkError(err: unknown) {
  const msg = String((err as { message?: string })?.message ?? err ?? "");
  return !navigator.onLine || /fetch|network|timeout|Failed to fetch|Load failed/i.test(msg);
}

/** Pull everything the signed-in user owns, then lay unsent local edits back on top. */
export async function pullAll() {
  const sb = supabase();
  const session = useUI.getState().session;
  if (!sb || !session) return;
  useUI.getState().set({ sync: "syncing" });
  try {
    const [s, c, e, b] = await Promise.all([
      sb.from("settings").select("*").maybeSingle(),
      sb.from("categories").select("*").order("sort"),
      sb.from("entries").select("*").order("date", { ascending: false }).limit(20000),
      sb.from("bills").select("*"),
    ]);
    const err = s.error || c.error || e.error || b.error;
    if (err) throw err;

    const local = useData.getState();
    let settings = s.data ? fromRow.settings(s.data) : null;
    let categories = (c.data ?? []).map(fromRow.categories);
    let entries = (e.data ?? []).map(fromRow.entries);
    let bills = (b.data ?? []).map(fromRow.bills);

    for (const op of local.outbox) {
      if (op.table === "settings") {
        if (op.kind === "upsert" && local.settings) settings = local.settings;
        continue;
      }
      const overlay = <T extends { id: string }>(server: T[], mine: T[]) => {
        const rest = server.filter((x) => x.id !== op.rowId);
        if (op.kind === "delete") return rest;
        const row = mine.find((x) => x.id === op.rowId);
        return row ? [...rest, row] : rest;
      };
      if (op.table === "categories") categories = overlay(categories, local.categories);
      if (op.table === "entries") entries = overlay(entries, local.entries);
      if (op.table === "bills") bills = overlay(bills, local.bills);
    }

    useData.getState().replaceAll({ settings, categories, entries, bills, lastSyncedAt: new Date().toISOString() });
    useUI.getState().set({ sync: "idle" });
    void flush();
  } catch (err) {
    useUI.getState().set({ sync: isNetworkError(err) ? "offline" : "error" });
    scheduleRetry();
  }
}

function scheduleRetry(ms = 6000) {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(() => void (useData.getState().lastSyncedAt ? flush() : pullAll()), ms);
}

async function pushOne(op: OutboxOp, userId: string) {
  const sb = supabase()!;
  const s = useData.getState();
  if (op.kind === "delete") {
    const q = op.table === "settings" ? sb.from("settings").delete().eq("user_id", userId) : sb.from(op.table).delete().eq("id", op.rowId);
    const { error } = await q;
    if (error) throw error;
    return;
  }
  let row: Row | null = null;
  if (op.table === "settings" && s.settings) row = toRow.settings(s.settings, userId);
  if (op.table === "categories") {
    const c = s.categories.find((x) => x.id === op.rowId);
    if (c) row = toRow.categories(c, userId);
  }
  if (op.table === "entries") {
    const e = s.entries.find((x) => x.id === op.rowId);
    if (e) row = toRow.entries(e, userId);
  }
  if (op.table === "bills") {
    const b = s.bills.find((x) => x.id === op.rowId);
    if (b) row = toRow.bills(b, userId);
  }
  if (!row) return; // deleted locally before it was sent
  const { error } = await sb.from(op.table).upsert(row, { onConflict: op.table === "settings" ? "user_id" : "id" });
  if (error) throw error;
}

/** Send queued local edits in order. Network failures wait and retry; rejected rows are dropped. */
export async function flush() {
  const session = useUI.getState().session;
  if (!cloudEnabled || !session || flushing) return;
  flushing = true;
  let rejected = 0;
  try {
    while (true) {
      const queue = [...useData.getState().outbox].sort(
        (a, b) => ORDER.indexOf(a.table) - ORDER.indexOf(b.table) || a.at - b.at,
      );
      // Deletes of parents go last so children are cleaned first; upserts keep parent-first order.
      const op = queue.find((o) => o.kind === "upsert") ?? queue[queue.length - 1];
      if (!op) break;
      useUI.getState().set({ sync: "syncing" });
      try {
        await pushOne(op, session.userId);
        useData.getState().dequeue(op.key, op.at);
      } catch (err) {
        if (isNetworkError(err)) {
          useUI.getState().set({ sync: "offline" });
          scheduleRetry();
          return;
        }
        console.warn("[sync] rejected", op, err);
        rejected++;
        useData.getState().dequeue(op.key, op.at);
      }
    }
    useUI.getState().set({ sync: "idle" });
    useData.getState().replaceAll({ lastSyncedAt: new Date().toISOString() });
    if (rejected) useUI.getState().toast(`${rejected} change${rejected > 1 ? "s" : ""} couldn't be saved to the cloud.`, { tone: "error" });
  } finally {
    flushing = false;
  }
}

/* -------------------------------------------------------------- realtime */

function applyRemote(table: TableName, kind: "INSERT" | "UPDATE" | "DELETE", row: Row, old: Row) {
  const st = useData.getState();
  const id = (row?.id ?? old?.id) as string | undefined;
  if (st.outbox.some((o) => o.table === table && (table === "settings" || o.rowId === id))) return; // our own edit is newer
  if (table === "settings") {
    if (kind !== "DELETE") st.replaceAll({ settings: fromRow.settings(row) });
    return;
  }
  const patch = <T extends { id: string }>(list: T[], map: (r: Row) => T) =>
    kind === "DELETE" ? list.filter((x) => x.id !== id) : [...list.filter((x) => x.id !== id), map(row)];
  if (table === "categories") st.replaceAll({ categories: patch(st.categories, fromRow.categories).sort((a, b) => a.sort - b.sort) });
  if (table === "entries") st.replaceAll({ entries: patch(st.entries, fromRow.entries) });
  if (table === "bills") st.replaceAll({ bills: patch(st.bills, fromRow.bills) });
}

function startRealtime(userId: string) {
  const sb = supabase();
  if (!sb) return;
  channel?.unsubscribe();
  channel = sb.channel(`ledger-${userId}`);
  for (const table of ORDER) {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table, filter: `user_id=eq.${userId}` },
      (p) => applyRemote(table, p.eventType as "INSERT" | "UPDATE" | "DELETE", p.new as Row, p.old as Row),
    );
  }
  channel.subscribe();
}

/* ------------------------------------------------------------------ boot */

let booted = false;

/** Wire the store to the cloud (or local-only mode) once, on the client. */
export function bootSync() {
  if (booted || typeof window === "undefined") return;
  booted = true;
  const sb = supabase();
  bindSync(() => void flush(), !!sb);

  if (!sb) {
    useUI.getState().set({ sync: "local", authReady: true, session: null });
    return;
  }

  const onSession = (session: { user: { id: string; email?: string | null } } | null) => {
    const prev = useUI.getState().session;
    if (!session) {
      channel?.unsubscribe();
      useUI.getState().set({ session: null, authReady: true, sync: "idle" });
      return;
    }
    const userId = session.user.id;
    if (prev?.userId === userId) return;
    if (useData.getState().ownerId !== userId) useData.getState().wipeLocal(userId);
    useUI.getState().set({ session: { userId, email: session.user.email ?? null }, authReady: true });
    void pullAll();
    startRealtime(userId);
  };

  sb.auth.getSession().then(({ data }) => onSession(data.session));
  sb.auth.onAuthStateChange((_evt, session) => onSession(session));

  window.addEventListener("online", () => void flush());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && useUI.getState().session) void pullAll();
  });
}

export async function signOut() {
  const sb = supabase();
  channel?.unsubscribe();
  useData.getState().wipeLocal(null);
  await sb?.auth.signOut();
}
