-- An advertiser can buy several ad types in one checkout: one Stripe subscription (one item per ad)
-- then covers several ad_slots rows, so the session/subscription ids are no longer unique.
alter table public.ad_slots drop constraint if exists ad_slots_stripe_session_id_key;
alter table public.ad_slots drop constraint if exists ad_slots_stripe_subscription_id_key;
create index if not exists ad_slots_subscription on public.ad_slots (stripe_subscription_id) where stripe_subscription_id is not null;
