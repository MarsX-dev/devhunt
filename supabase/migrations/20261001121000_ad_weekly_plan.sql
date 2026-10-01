-- Sidebar and inline ads can be bought for one week (one-time payment): plan 'weekly'. They run until
-- current_period_end (7 days after they start) and are then ended by expireWeeklyAds (utils/server/ads.ts).
alter table public.ad_slots drop constraint if exists ad_slots_plan_check;
alter table public.ad_slots add constraint ad_slots_plan_check check (plan in ('monthly', 'single', 'weekly'));
