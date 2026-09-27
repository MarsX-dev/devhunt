-- Newsletter ads come as a monthly plan (4 editions a month, recurring) or a single edition (one-time
-- payment). A single edition is counted down when the weekly email goes out and then ends.
alter table public.ad_slots add column if not exists plan text not null default 'monthly';
alter table public.ad_slots drop constraint if exists ad_slots_plan_check;
alter table public.ad_slots add constraint ad_slots_plan_check check (plan in ('monthly', 'single'));
alter table public.ad_slots add column if not exists editions_left smallint; -- single edition: 1 until sent
