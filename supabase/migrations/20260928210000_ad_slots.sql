-- Paid sponsor slots (the side rails on desktop, the pill strip on mobile). One row per ad, from the
-- draft the advertiser generates from their URL to the end of its subscription. Written only by the
-- server (service role); advertisers read their own rows, visitors get active ads via /api/ads/slots.
create table if not exists public.ad_slots (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  slot smallint check (slot between 1 and 5),
  url text not null,
  name text not null,
  tagline text not null,
  logo_url text,
  -- draft: generated, not paid · blocked: JEV refused it · active: live · canceling: live until
  -- current_period_end · ended: subscription over, slot free again
  status text not null default 'draft' check (status in ('draft', 'blocked', 'active', 'canceling', 'ended')),
  moderation jsonb not null default '{}',
  stripe_session_id text unique,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  current_period_end timestamptz,
  started_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now()
);

-- A slot holds one live ad at a time.
create unique index if not exists ad_slots_live_slot on public.ad_slots (slot) where status in ('active', 'canceling');
create index if not exists ad_slots_user on public.ad_slots (user_id, created_at desc);

alter table public.ad_slots enable row level security;
drop policy if exists "ad_slots owner read" on public.ad_slots;
create policy "ad_slots owner read" on public.ad_slots for select to authenticated using (user_id = auth.uid());
