-- Payday Ledger · Supabase schema
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.
-- Every table is private per user through Row Level Security.

create extension if not exists "pgcrypto";

-- Settings: one row per user ------------------------------------------------
create table if not exists public.settings (
  user_id    uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  take_home  numeric(12,2) not null default 0,
  currency   text not null default 'USD',
  targets    jsonb not null default '{"needs":0.5,"wants":0.3,"savings":0.2}',
  updated_at timestamptz not null default now()
);

-- Budget categories -------------------------------------------------------------
create table if not exists public.categories (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name     text not null,
  bucket   text not null check (bucket in ('needs','wants','savings')),
  budget   numeric(12,2) not null default 0,
  sort     integer not null default 0
);
create index if not exists categories_user_idx on public.categories (user_id);

-- Recurring bills ---------------------------------------------------------------
create table if not exists public.bills (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name        text not null,
  category_id uuid references public.categories (id) on delete set null,
  amount      numeric(12,2),
  due_day     smallint not null default 1 check (due_day between 1 and 31),
  autopay     boolean not null default false,
  method      text,
  is_sample   boolean not null default false
);
create index if not exists bills_user_idx on public.bills (user_id);

-- Income and expense entries ----------------------------------------------------
create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade default auth.uid(),
  type        text not null check (type in ('income','expense')),
  date        date not null,
  amount      numeric(12,2),            -- expenses
  gross       numeric(12,2),            -- income
  deductions  numeric(12,2),            -- income
  category_id uuid references public.categories (id) on delete set null,
  description text,
  source      text,
  method      text,
  kind        text check (kind in ('Fixed','Variable')),
  bill_id     uuid references public.bills (id) on delete set null,
  note        text,
  is_sample   boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists entries_user_date_idx on public.entries (user_id, date desc);

-- Row Level Security: each user only ever sees and changes their own rows --------
alter table public.settings   enable row level security;
alter table public.categories enable row level security;
alter table public.bills      enable row level security;
alter table public.entries    enable row level security;

do $$
declare t text;
begin
  foreach t in array array['settings','categories','bills','entries'] loop
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format(
      'create policy "own rows" on public.%I for all to authenticated
         using ((select auth.uid()) = user_id)
         with check ((select auth.uid()) = user_id)', t);
  end loop;
end $$;

-- Data API access for signed-in users (RLS above still limits them to their own rows) ----
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.settings, public.categories, public.bills, public.entries to authenticated;
revoke all on public.settings, public.categories, public.bills, public.entries from anon;

-- Live sync between your devices ---------------------------------------------------
alter table public.entries    replica identity full;
alter table public.bills      replica identity full;
alter table public.categories replica identity full;
alter table public.settings   replica identity full;

do $$
declare t text;
begin
  foreach t in array array['settings','categories','bills','entries'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
