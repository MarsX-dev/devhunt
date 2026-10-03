-- First-party analytics: page views, unique visitors and countries, stored as daily counters (one
-- row per day+country and per day+path) instead of one row per hit, so it stays small and fast.
-- Written only through track_pageview() by /api/hit (service role).
CREATE TABLE IF NOT EXISTS public.analytics_daily (
  day date NOT NULL,
  country text NOT NULL, -- ISO 3166-1 alpha-2, 'XX' when unknown
  pageviews bigint NOT NULL DEFAULT 0,
  visitors bigint NOT NULL DEFAULT 0, -- unique visitors that day
  new_visitors bigint NOT NULL DEFAULT 0, -- first visit ever
  PRIMARY KEY (day, country)
);

CREATE TABLE IF NOT EXISTS public.analytics_pages (
  day date NOT NULL,
  path text NOT NULL,
  pageviews bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (day, path)
);

ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_pages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.analytics_daily, public.analytics_pages FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.track_pageview(_path text, _country text, _new_today boolean, _new_visitor boolean)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  INSERT INTO analytics_daily AS a (day, country, pageviews, visitors, new_visitors)
  VALUES ((now() AT TIME ZONE 'utc')::date, _country, 1, _new_today::int, _new_visitor::int)
  ON CONFLICT (day, country) DO UPDATE SET
    pageviews = a.pageviews + 1,
    visitors = a.visitors + EXCLUDED.visitors,
    new_visitors = a.new_visitors + EXCLUDED.new_visitors;

  INSERT INTO analytics_pages AS p (day, path, pageviews)
  VALUES ((now() AT TIME ZONE 'utc')::date, left(_path, 200), 1)
  ON CONFLICT (day, path) DO UPDATE SET pageviews = p.pageviews + 1;
$function$;
REVOKE EXECUTE ON FUNCTION public.track_pageview(text, text, boolean, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_pageview(text, text, boolean, boolean) TO service_role;

-- Unique visitors since launch: 452,356 counted before first-party tracking started (2026-09-28),
-- plus first-time visitors since.
CREATE OR REPLACE FUNCTION public.get_site_stats()
 RETURNS json
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT json_build_object(
    'total_views', (SELECT coalesce(sum(views_count), 0) FROM products WHERE NOT deleted),
    'views_today', (SELECT coalesce(sum(views), 0) FROM site_daily_views WHERE day = (now() AT TIME ZONE 'utc')::date),
    'tools_launched', (SELECT count(*) FROM products WHERE NOT deleted AND launch_start <= now()),
    'tools_this_week', (SELECT count(*) FROM products WHERE NOT deleted AND launch_start <= now() AND launch_end >= now()),
    'users', (SELECT count(*) FROM auth.users),
    'users_today', (SELECT count(*) FROM auth.users WHERE created_at > now() - interval '24 hours'),
    'unique_visitors', 452356 + (SELECT coalesce(sum(new_visitors), 0) FROM analytics_daily)
  )
$function$;

-- Server-only report for the analytics page.
CREATE OR REPLACE FUNCTION public.get_analytics(_days integer)
 RETURNS json
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH since AS (SELECT (now() AT TIME ZONE 'utc')::date - (_days - 1) AS d)
  SELECT json_build_object(
    'daily', (SELECT coalesce(json_agg(t ORDER BY t.day), '[]') FROM (
      SELECT day, sum(pageviews) AS pageviews, sum(visitors) AS visitors, sum(new_visitors) AS new_visitors
      FROM analytics_daily WHERE day >= (SELECT d FROM since) GROUP BY day) t),
    'countries', (SELECT coalesce(json_agg(t), '[]') FROM (
      SELECT country, sum(pageviews) AS pageviews, sum(visitors) AS visitors
      FROM analytics_daily WHERE day >= (SELECT d FROM since) GROUP BY country ORDER BY sum(visitors) DESC, sum(pageviews) DESC LIMIT 25) t),
    'pages', (SELECT coalesce(json_agg(t), '[]') FROM (
      SELECT path, sum(pageviews) AS pageviews
      FROM analytics_pages WHERE day >= (SELECT d FROM since) GROUP BY path ORDER BY sum(pageviews) DESC LIMIT 25) t),
    'unique_visitors_all_time', 452356 + (SELECT coalesce(sum(new_visitors), 0) FROM analytics_daily)
  )
$function$;
REVOKE EXECUTE ON FUNCTION public.get_analytics(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics(integer) TO service_role;
