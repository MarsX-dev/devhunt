-- Page views without hot rows (same fix as bump_views, 2026-09-27 outage).
-- track_pageview ran on every page view and updated the single (day, country) row and the
-- (day, path) row: concurrent views from one country, or of the home page, queued on those row
-- locks while each held a PostgREST connection.

-- Each counter is spread over 8 rows (get_analytics and get_site_stats already sum the rows).
ALTER TABLE public.analytics_daily ADD COLUMN IF NOT EXISTS shard smallint NOT NULL DEFAULT 0;
ALTER TABLE public.analytics_daily DROP CONSTRAINT IF EXISTS analytics_daily_pkey;
ALTER TABLE public.analytics_daily ADD CONSTRAINT analytics_daily_pkey PRIMARY KEY (day, country, shard);

ALTER TABLE public.analytics_pages ADD COLUMN IF NOT EXISTS shard smallint NOT NULL DEFAULT 0;
ALTER TABLE public.analytics_pages DROP CONSTRAINT IF EXISTS analytics_pages_pkey;
ALTER TABLE public.analytics_pages ADD CONSTRAINT analytics_pages_pkey PRIMARY KEY (day, path, shard);

-- A view that can't get its row within 2s is dropped instead of holding a connection.
CREATE OR REPLACE FUNCTION public.track_pageview(_path text, _country text, _new_today boolean, _new_visitor boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  s smallint := floor(random() * 8)::smallint;
BEGIN
  SET LOCAL lock_timeout = '2s';
  INSERT INTO analytics_daily AS a (day, country, shard, pageviews, visitors, new_visitors)
  VALUES ((now() AT TIME ZONE 'utc')::date, _country, s, 1, _new_today::int, _new_visitor::int)
  ON CONFLICT (day, country, shard) DO UPDATE SET
    pageviews = a.pageviews + 1,
    visitors = a.visitors + EXCLUDED.visitors,
    new_visitors = a.new_visitors + EXCLUDED.new_visitors;

  INSERT INTO analytics_pages AS p (day, path, shard, pageviews)
  VALUES ((now() AT TIME ZONE 'utc')::date, left(_path, 200), s, 1)
  ON CONFLICT (day, path, shard) DO UPDATE SET pageviews = p.pageviews + 1;
EXCEPTION WHEN lock_not_available THEN
  RETURN;
END
$function$;
REVOKE EXECUTE ON FUNCTION public.track_pageview(text, text, boolean, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_pageview(text, text, boolean, boolean) TO service_role;
