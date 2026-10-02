# Payday Ledger

A private salary and expense tracker built on one rule: **give every dollar of your paycheck a job.**
You log each paycheck and expense, the money is split into Needs, Wants and Savings & Debt, and you review once a month.

**Look and feel.** Obsidian-black glass panels, ivory serif headlines, a champagne accent, and three jewel tones for the buckets:

| Bucket | Colour |
| --- | --- |
| Needs | sapphire |
| Wants | rose |
| Savings & Debt | gold |

Everything moves, but quietly:

- Numbers count up as they come into view.
- Digits blur-slide when they change.
- Ribbons in the paycheck-flow chart draw themselves in, with drifting light particles.
- Bars grow with springs.
- Sheets glide in. On phones they're draggable bottom sheets.

## What's inside

**Overview:**
- Take-home pay and where it went.
- A savings-rate ring.
- A live **paycheck-flow (Sankey) chart**: gross → taxes / take-home → buckets → top categories.
- A 50/30/20 check.
- Budgets close to their limit.
- A spending-by-day heatmap.
- A 12-month trend.
- Bills due and recent activity.

**Quick add (⌘K / Ctrl+K, or the gold ＋ on phones):** type plain English and press Enter.

| You type | It logs |
| --- | --- |
| `54.20 groceries trader joes` | Expense · Groceries · today |
| `uber 18 yesterday` | Expense · Transportation · yesterday |
| `rent 1500 oct 1` | Expense · Housing · Oct 1 |
| `+3250 salary` | Income · Salary · today |

Press Tab to open the full form, prefilled.

**Other pages:**
- **Activity:** filters, search, day drill-down from the heatmap, and CSV export.
- **Budget:** your take-home pay, target split and categories, all edited inline. It shows when every dollar is assigned. You can also back up and restore as JSON, and load or clear sample data.
- **Bills:** recurring bills with due-date status. "Log payment" adds the bill to the month's expenses.
- **Year:** savings rate by month, a full month-by-month table, and an emergency-fund target (3–6 months of Needs).
- **How it works:** the monthly routine, bookkeeping rules and keyboard shortcuts.

**Sync:** it works offline first. Edits save instantly on the device, then sync to Supabase and update live on your other devices.

**Install:** it's a PWA, so you can use **Add to Home Screen** on iPhone or Android.

## Stack

- Next.js 16 (App Router) with React 19 and TypeScript.
- Tailwind CSS v4.
- Motion (formerly Framer Motion).
- Zustand for client state and the offline cache.
- Supabase for Postgres, Auth (email link or code), Row Level Security and Realtime.
- Fonts: Geist and Geist Mono for the UI and figures, Instrument Serif for display. All fonts are bundled from npm, so builds never need Google Fonts.

## 1 · Run it locally (2 minutes)

```bash
npm install
npm run dev          # http://localhost:3000
```

With no environment variables, it runs in **local-only mode**: no sign-in, and your data stays in that browser.
To try it, use **Explore with sample data** on the welcome screen.

## 2 · Turn on cloud sync with Supabase (10 minutes)

1. **Create a project** at [supabase.com](https://supabase.com) (the free tier is plenty).
2. **Create the tables.** Open the dashboard, go to **SQL Editor → New query**, paste [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. This creates four tables (`settings`, `categories`, `bills`, `entries`). It also turns on Row Level Security, so each account only sees its own rows, and enables Realtime for live sync.
3. **Get your keys.** Open **Project Settings → API** (or the **Connect** button) and copy the **Project URL** and the **anon / publishable key**.
4. **Add them locally.** Copy `.env.example` to `.env.local`, fill it in, then restart `npm run dev`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # or sb_publishable_...
   ```
5. **Allow your sign-in URLs.** Open **Authentication → URL Configuration**:
   - Set **Site URL** to your production URL, e.g. `https://ledger.yourdomain.com`.
   - Add every place you'll open the app to **Redirect URLs**, e.g. `http://localhost:3000/**` and `https://ledger.yourdomain.com/**`.
6. **(Optional, recommended for phones) Show a 6-digit code in the sign-in email.**
   - Open **Authentication → Emails → Magic Link** and add `{{ .Token }}` to the template.
   - You can then type the code in the app instead of tapping the link. This matters for a home-screen app on iPhone: links open in Safari, which keeps its sign-in separate from the home-screen app.
7. **(Optional) Use your own email sender.** Supabase's built-in sender is rate-limited. For reliable delivery, add your own provider (Resend, Postmark, SES and so on) under **Authentication → Emails → SMTP Settings**.

Once the keys are set, the app requires sign-in and every device you sign in on stays in sync.
Data you created in local-only mode isn't uploaded automatically. To bring it into the cloud, use **Budget → Back up (JSON)** before switching, then **Restore** after you sign in.

## 3 · Deploy

### Vercel (recommended)
1. Push this folder to a GitHub repo.
2. In Vercel, use **Add New → Project** and import the repo. The framework is detected as Next.js.
3. Under **Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Click **Deploy**, then add the Vercel URL (and any custom domain) to Supabase **Redirect URLs** (step 5 above).

### Netlify, Render, Railway, Cloudflare or a VPS
- It's a standard Next.js app: the build is `npm run build` and the start command is `npm start`. Set the same two environment variables.
- On Netlify, the Next.js runtime is picked up automatically.
- On your own server, run it behind a reverse proxy with `PORT=3000 npm start`.

### Docker (optional)
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]
```
`NEXT_PUBLIC_*` variables are baked in at build time. Pass them as build args, or put them in `.env.production` before `npm run build`.

## How the numbers work

| Figure | How it's calculated |
| --- | --- |
| Take-home | gross pay − taxes & deductions (per paycheck) |
| Spending | Needs + Wants (+ anything uncategorized) |
| Saved & invested | expenses in Savings & Debt categories |
| Left over | take-home − everything logged |
| Savings rate | (Saved & invested + Left over) ÷ take-home |
| 50/30/20 check | each bucket ÷ take-home, against the targets you set on Budget |

Bookkeeping rules (also in the app):
- **Credit cards:** log card purchases, not the card's monthly payment, or the spending counts twice.
- **Payroll deductions:** these go in the paycheck's deductions field.
- **Refunds:** enter them as negative amounts in the original category.

## Keyboard

| Keys | Action |
| --- | --- |
| ⌘K / Ctrl+K or `/` | Quick add |
| `N` | New expense |
| `I` | Log a paycheck |
| `[` / `]` | Previous / next month |
| `1`–`6` | Jump between pages |
| `Esc` | Close sheet or palette |

## Project map

```
src/
  app/
    layout.tsx               fonts, metadata, animated backdrop
    (app)/layout.tsx         app shell + page transitions
    (app)/page.tsx           Overview      → components/views/overview.tsx
    (app)/activity|budget|bills|year|guide
    manifest.ts, icon.svg, apple-icon.png   PWA bits
  components/
    shell/      sidebar, mobile dock, month switcher, sync badge
    charts/     paycheck-flow (Sankey), trend, savings ring, spend calendar
    command/    quick-add palette
    entries/    entry + bill sheets, entry row
    auth/       sign-in, first-run welcome
    ui/         spotlight card, animate-digits, money, buttons, fields, sheet, toaster
    views/      one file per page
  lib/
    store.ts    Zustand stores (data + UI), offline cache and change queue
    sync.ts     Supabase pull / push queue / realtime
    calc.ts     all money math
    parse.ts    quick-add natural-language parser
    defaults.ts categories, buckets, colours, currencies
    sample.ts   clearable sample data
supabase/schema.sql
```

## Credits

- **Animate Digits:** adapted from [unlumen](https://ui.unlumen.com) via 21st.dev.
- **Spotlight Card:** adapted from [preetsuthar17](https://21st.dev/@preetsuthar17) via 21st.dev.
- **Icons:** [Lucide](https://lucide.dev).

The 50/30/20 split and the emergency-fund range are common general guidelines, not personal financial advice.
