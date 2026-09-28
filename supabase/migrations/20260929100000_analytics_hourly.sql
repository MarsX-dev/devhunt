-- Hourly visit counters for the 24h view of /account/analytics (per hour + country, like
-- analytics_daily). Pages stay daily. Rows older than 3 days are pruned now and then by track_hit().
CREATE TABLE IF NOT EXISTS public.analytics_hourly (
  hour timestamptz NOT NULL, -- start of the UTC hour
  country text NOT NULL,
  pageviews bigint NOT NULL DEFAULT 0,
  visitors bigint NOT NULL DEFAULT 0, -- unique visitors that hour
  new_visitors bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (hour, country)
);
ALTER TABLE public.analytics_hourly ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.analytics_hourly FROM anon, authenticated;

-- Replaces track_pageview() for /api/hit (daily + hourly counters in one call). track_pageview stays
-- until the deployed code no longer calls it.
CREATE OR REPLACE FUNCTION public.track_hit(_path text, _country text, _new_today boolean, _new_visitor boolean, _new_hour boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  PERFORM track_pageview(_path, _country, _new_today, _new_visitor);

  INSERT INTO analytics_hourly AS h (hour, country, pageviews, visitors, new_visitors)
  VALUES (date_trunc('hour', now()), _country, 1, _new_hour::int, _new_visitor::int)
  ON CONFLICT (hour, country) DO UPDATE SET
    pageviews = h.pageviews + 1,
    visitors = h.visitors + EXCLUDED.visitors,
    new_visitors = h.new_visitors + EXCLUDED.new_visitors;

  IF random() < 0.001 THEN
    DELETE FROM analytics_hourly WHERE hour < now() - interval '3 days';
  END IF;
END
$function$;
REVOKE EXECUTE ON FUNCTION public.track_hit(text, text, boolean, boolean, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_hit(text, text, boolean, boolean, boolean) TO service_role;

-- Last 24 hours for the analytics page: per hour, countries; pages from the daily table (today and yesterday).
CREATE OR REPLACE FUNCTION public.get_analytics_hourly()
 RETURNS json
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH since AS (SELECT date_trunc('hour', now()) - interval '23 hours' AS h)
  SELECT json_build_object(
    'hourly', (SELECT coalesce(json_agg(t ORDER BY t.hour), '[]') FROM (
      SELECT hour, sum(pageviews) AS pageviews, sum(visitors) AS visitors, sum(new_visitors) AS new_visitors
      FROM analytics_hourly WHERE hour >= (SELECT h FROM since) GROUP BY hour) t),
    'countries', (SELECT coalesce(json_agg(t), '[]') FROM (
      SELECT country, sum(pageviews) AS pageviews, sum(visitors) AS visitors
      FROM analytics_hourly WHERE hour >= (SELECT h FROM since) GROUP BY country ORDER BY sum(visitors) DESC, sum(pageviews) DESC LIMIT 25) t),
    'pages', (SELECT coalesce(json_agg(t), '[]') FROM (
      SELECT path, sum(pageviews) AS pageviews
      FROM analytics_pages WHERE day >= (now() AT TIME ZONE 'utc')::date - 1 GROUP BY path ORDER BY sum(pageviews) DESC LIMIT 25) t),
    'unique_visitors_all_time', 452356 + (SELECT coalesce(sum(new_visitors), 0) FROM analytics_daily)
  )
$function$;
REVOKE EXECUTE ON FUNCTION public.get_analytics_hourly() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_hourly() TO service_role;
