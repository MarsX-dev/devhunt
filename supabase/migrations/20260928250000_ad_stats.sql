-- Sponsor ad stats for the advertiser portal: impressions and clicks per ad, day, country and device.
-- Same write pattern as track_pageview (2026-09-27 outage): counters spread over 8 shard rows, a
-- 2s lock timeout drops an event instead of holding a connection, one call per page view.
create table if not exists public.ad_stats_daily (
  day date not null,
  ad_id bigint not null references public.ad_slots (id) on delete cascade,
  country text not null default 'XX',
  device text not null default 'desktop', -- desktop | mobile | tablet | email
  shard smallint not null default 0,
  impressions integer not null default 0,
  clicks integer not null default 0,
  primary key (day, ad_id, country, device, shard)
);
create index if not exists ad_stats_daily_ad on public.ad_stats_daily (ad_id, day);
alter table public.ad_stats_daily enable row level security; -- service role only

-- Ads seen on one page view (all of them in one call).
create or replace function public.track_ad_impressions(_ids bigint[], _country text, _device text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  s smallint := floor(random() * 8)::smallint;
begin
  set local lock_timeout = '2s';
  insert into ad_stats_daily as a (day, ad_id, country, device, shard, impressions)
  select (now() at time zone 'utc')::date, id, left(coalesce(_country, 'XX'), 2), left(coalesce(_device, 'desktop'), 10), s, 1
  from (select distinct unnest(_ids[1:12]) as id) ids
  where exists (select 1 from ad_slots where ad_slots.id = ids.id)
  on conflict (day, ad_id, country, device, shard) do update set impressions = a.impressions + 1;
exception when lock_not_available then
  return;
end
$function$;

create or replace function public.track_ad_click(_id bigint, _country text, _device text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  s smallint := floor(random() * 8)::smallint;
begin
  set local lock_timeout = '2s';
  insert into ad_stats_daily as a (day, ad_id, country, device, shard, clicks)
  values ((now() at time zone 'utc')::date, _id, left(coalesce(_country, 'XX'), 2), left(coalesce(_device, 'desktop'), 10), s, 1)
  on conflict (day, ad_id, country, device, shard) do update set clicks = a.clicks + 1;
exception when lock_not_available or foreign_key_violation then
  return;
end
$function$;

-- A newsletter edition went out: its recipients count as impressions (device 'email').
create or replace function public.track_ad_newsletter(_id bigint, _recipients integer)
 returns void
 language sql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
  insert into ad_stats_daily as a (day, ad_id, country, device, shard, impressions)
  values ((now() at time zone 'utc')::date, _id, 'XX', 'email', 0, _recipients)
  on conflict (day, ad_id, country, device, shard) do update set impressions = a.impressions + excluded.impressions;
$function$;

-- Everything the portal shows for a set of ads since a day, aggregated in one round trip.
create or replace function public.ad_stats(_ids bigint[], _from date)
 returns json
 language sql
 stable
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
  with r as (select * from ad_stats_daily where ad_id = any(_ids) and day >= _from)
  select json_build_object(
    'totals', (select json_build_object('impressions', coalesce(sum(impressions), 0), 'clicks', coalesce(sum(clicks), 0)) from r),
    'daily', coalesce((select json_agg(d order by d.day) from (select day, sum(impressions) as impressions, sum(clicks) as clicks from r group by day) d), '[]'),
    'countries', coalesce((select json_agg(c order by c.impressions desc) from (select country, sum(impressions) as impressions, sum(clicks) as clicks from r where device <> 'email' group by country order by 2 desc limit 12) c), '[]'),
    'devices', coalesce((select json_agg(v order by v.impressions desc) from (select device, sum(impressions) as impressions, sum(clicks) as clicks from r group by device) v), '[]'),
    'ads', coalesce((select json_agg(x) from (select ad_id, sum(impressions) as impressions, sum(clicks) as clicks from r group by ad_id) x), '[]')
  );
$function$;

revoke execute on function public.track_ad_impressions(bigint[], text, text) from public, anon, authenticated;
revoke execute on function public.track_ad_click(bigint, text, text) from public, anon, authenticated;
revoke execute on function public.track_ad_newsletter(bigint, integer) from public, anon, authenticated;
revoke execute on function public.ad_stats(bigint[], date) from public, anon, authenticated;
grant execute on function public.track_ad_impressions(bigint[], text, text) to service_role;
grant execute on function public.track_ad_click(bigint, text, text) to service_role;
grant execute on function public.track_ad_newsletter(bigint, integer) to service_role;
grant execute on function public.ad_stats(bigint[], date) to service_role;
