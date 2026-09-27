-- Three sponsor products share ad_slots: rail (side cards / mobile strip), inline (native row in tool
-- lists) and newsletter (the sponsor block in the weekly email). Slots are numbered per product.
alter table public.ad_slots add column if not exists kind text not null default 'rail';
alter table public.ad_slots add column if not exists description text; -- longer copy for the newsletter
alter table public.ad_slots add column if not exists image_url text; -- newsletter banner (site's og:image)
alter table public.ad_slots add column if not exists refunded_at timestamptz;

alter table public.ad_slots drop constraint if exists ad_slots_kind_check;
alter table public.ad_slots add constraint ad_slots_kind_check check (kind in ('rail', 'inline', 'newsletter'));
alter table public.ad_slots drop constraint if exists ad_slots_slot_check;
alter table public.ad_slots add constraint ad_slots_slot_check check (slot between 1 and 10);

drop index if exists public.ad_slots_live_slot;
create unique index if not exists ad_slots_live_kind_slot on public.ad_slots (kind, slot) where status in ('active', 'canceling');
